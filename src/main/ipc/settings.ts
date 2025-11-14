import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('settings:getAll', async () => {
  try {
    const settings = await db.select().from(schema.settings).all();
    const settingsMap: Record<string, string> = {};
    settings.forEach((s) => {
      settingsMap[s.key] = s.value;
    });
    return { success: true, data: settingsMap };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('settings:get', async (_, key: string) => {
  try {
    const setting = await db.select().from(schema.settings)
      .where(eq(schema.settings.key, key))
      .get();
    return { success: true, data: setting?.value };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('settings:update', async (_, key: string, value: string) => {
  try {
    await db.insert(schema.settings).values({ key, value })
      .onConflictDoUpdate({
        target: schema.settings.key,
        set: { value, updatedAt: new Date().toISOString() },
      });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
