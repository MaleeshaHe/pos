import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

let currentUser: any = null;

safeHandle('users:login', async (_, username: string, password: string) => {
  try {
    const hashedPassword = hashPassword(password);
    const user = await db.select().from(schema.users)
      .where(eq(schema.users.username, username))
      .get();

    if (!user) {
      return { success: false, error: 'User not found' };
    }

    if (user.password !== hashedPassword) {
      return { success: false, error: 'Invalid password' };
    }

    if (!user.isActive) {
      return { success: false, error: 'User is deactivated' };
    }

    // Set current user (excluding password)
    currentUser = {
      id: user.id,
      username: user.username,
      fullName: user.fullName,
      role: user.role,
      email: user.email,
      phone: user.phone,
    };

    return { success: true, data: currentUser };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('users:getCurrent', async () => {
  return { success: true, data: currentUser };
});

safeHandle('users:getAll', async () => {
  try {
    const users = await db.select({
      id: schema.users.id,
      username: schema.users.username,
      fullName: schema.users.fullName,
      role: schema.users.role,
      email: schema.users.email,
      phone: schema.users.phone,
      isActive: schema.users.isActive,
      createdAt: schema.users.createdAt,
    }).from(schema.users).all();

    return { success: true, data: users };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('users:create', async (_, data: any) => {
  try {
    const hashedPassword = hashPassword(data.password);
    const result = await db.insert(schema.users).values({
      ...data,
      password: hashedPassword,
    }).returning({
      id: schema.users.id,
      username: schema.users.username,
      fullName: schema.users.fullName,
      role: schema.users.role,
    });

    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:update', async (_, id: number, data: any) => {
  try {
    // Don't update password if not provided
    const updateData: any = {
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      role: data.role,
      updatedAt: new Date().toISOString(),
    };

    if (data.password) {
      updateData.password = hashPassword(data.password);
    }

    await db.update(schema.users)
      .set(updateData)
      .where(eq(schema.users.id, id));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:toggleStatus', async (_, id: number) => {
  try {
    const user = await db.select().from(schema.users)
      .where(eq(schema.users.id, id))
      .get();

    await db.update(schema.users)
      .set({ isActive: !user?.isActive })
      .where(eq(schema.users.id, id));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('users:delete', async (_, id: number) => {
  try {
    // Soft delete by deactivating
    await db.update(schema.users)
      .set({ isActive: false })
      .where(eq(schema.users.id, id));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
