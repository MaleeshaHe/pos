import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('categories:getAll', async () => {
  try {
    const categories = await db.select().from(schema.categories).all();
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('categories:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.categories).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
