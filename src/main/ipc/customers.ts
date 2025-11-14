import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, like, or } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

const db = getDatabase();

safeHandle('customers:getAll', async () => {
  try {
    const customers = await db.select().from(schema.customers)
      .where(eq(schema.customers.isActive, true))
      .all();
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('customers:getById', async (_, id: number) => {
  try {
    const customer = await db.select().from(schema.customers)
      .where(eq(schema.customers.id, id))
      .get();
    return { success: true, data: customer };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('customers:search', async (_, query: string) => {
  try {
    const customers = await db.select().from(schema.customers)
      .where(
        or(
          like(schema.customers.name, `%${query}%`),
          like(schema.customers.phone, `%${query}%`)
        )
      )
      .limit(20)
      .all();
    return { success: true, data: customers };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('customers:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.customers).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('customers:update', async (_, id: number, data: any) => {
  try {
    const result = await db.update(schema.customers)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.customers.id, id))
      .returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('customers:getCredit', async (_, id: number) => {
  try {
    // Get customer with credit details
    const customer = await db.select().from(schema.customers)
      .where(eq(schema.customers.id, id))
      .get();

    // Get credit bills
    const creditBills = await db.select().from(schema.bills)
      .where(eq(schema.bills.customerId, id))
      .all();

    // Get credit payments
    const payments = await db.select().from(schema.creditPayments)
      .where(eq(schema.creditPayments.customerId, id))
      .all();

    return {
      success: true,
      data: {
        customer,
        bills: creditBills,
        payments,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
