import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, desc, and, gte, lte } from 'drizzle-orm';

const db = getDatabase();

// Log an activity
ipcMain.handle('activityLogs:create', async (_, data: {
  userId: number;
  action: string;
  module: string;
  details?: string;
}) => {
  try {
    await db.insert(schema.activityLogs).values({
      userId: data.userId,
      action: data.action,
      module: data.module,
      details: data.details || null,
      ipAddress: '127.0.0.1', // In Electron, this is always localhost
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get all activity logs with filters
ipcMain.handle('activityLogs:getAll', async (_, filters?: {
  userId?: number;
  module?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) => {
  try {
    // Build the query with joins
    let query = db.select({
      id: schema.activityLogs.id,
      userId: schema.activityLogs.userId,
      userName: schema.users.fullName,
      userRole: schema.users.role,
      action: schema.activityLogs.action,
      module: schema.activityLogs.module,
      details: schema.activityLogs.details,
      ipAddress: schema.activityLogs.ipAddress,
      createdAt: schema.activityLogs.createdAt,
    })
    .from(schema.activityLogs)
    .leftJoin(schema.users, eq(schema.activityLogs.userId, schema.users.id))
    .orderBy(desc(schema.activityLogs.createdAt))
    .$dynamic();

    // Apply filters if provided
    const conditions = [];

    if (filters?.userId) {
      conditions.push(eq(schema.activityLogs.userId, filters.userId));
    }

    if (filters?.module) {
      conditions.push(eq(schema.activityLogs.module, filters.module));
    }

    if (filters?.startDate) {
      conditions.push(gte(schema.activityLogs.createdAt, filters.startDate));
    }

    if (filters?.endDate) {
      conditions.push(lte(schema.activityLogs.createdAt, filters.endDate));
    }

    // Apply where conditions if any exist
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const logs = await query.limit(filters?.limit || 100).all();

    return { success: true, data: logs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get activity logs for a specific user
ipcMain.handle('activityLogs:getByUser', async (_, userId: number) => {
  try {
    const logs = await db.select()
      .from(schema.activityLogs)
      .where(eq(schema.activityLogs.userId, userId))
      .orderBy(desc(schema.activityLogs.createdAt))
      .limit(50)
      .all();

    return { success: true, data: logs };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
