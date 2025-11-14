import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';

const db = getDatabase();

ipcMain.handle('categories:getAll', async () => {
  try {
    const categories = await db.select().from(schema.categories).all();
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('categories:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.categories).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
