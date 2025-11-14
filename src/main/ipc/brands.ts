import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('brands:getAll', async () => {
  try {
    const brands = await db.select().from(schema.brands).all();
    return { success: true, data: brands };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('brands:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.brands).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
