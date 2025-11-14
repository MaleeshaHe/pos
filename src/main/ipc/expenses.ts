import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { and, gte, lte } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('expenses:getAll', async (_, filters?: any) => {
  try {
    let query = db.select().from(schema.expenses);

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          gte(schema.expenses.date, filters.startDate),
          lte(schema.expenses.date, filters.endDate)
        )
      ) as any;
    }

    const expenses = await query.all();
    return { success: true, data: expenses };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('expenses:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.expenses).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('expenseCategories:getAll', async () => {
  try {
    const categories = await db.select().from(schema.expenseCategories).all();
    return { success: true, data: categories };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
