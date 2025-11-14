import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('suppliers:getAll', async () => {
  try {
    const suppliers = await db.select().from(schema.suppliers)
      .where(eq(schema.suppliers.isActive, true))
      .all();
    return { success: true, data: suppliers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('suppliers:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.suppliers).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
