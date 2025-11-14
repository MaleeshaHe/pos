import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, sql } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('creditPayments:create', async (_, data: any) => {
  try {
    const result = await db.transaction(async (tx) => {
      // Create credit payment
      const [payment] = await tx.insert(schema.creditPayments).values(data).returning();

      // Update customer credit
      await tx.update(schema.customers)
        .set({
          currentCredit: sql`${schema.customers.currentCredit} - ${data.amount}`,
        })
        .where(eq(schema.customers.id, data.customerId));

      return payment;
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('creditPayments:getByCustomer', async (_, customerId: number) => {
  try {
    const payments = await db.select().from(schema.creditPayments)
      .where(eq(schema.creditPayments.customerId, customerId))
      .all();
    return { success: true, data: payments };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
