import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';

const db = getDatabase();

// Generate bill number
function generateBillNumber(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `INV-${year}${month}${day}-${time}${random}`;
}

ipcMain.handle('bills:create', async (_, data: any) => {
  try {
    const billNumber = generateBillNumber();

    // Start transaction
    const result = await db.transaction(async (tx) => {
      // Create bill
      const [bill] = await tx.insert(schema.bills).values({
        billNumber,
        customerId: data.customerId,
        userId: data.userId,
        subtotal: data.subtotal,
        discount: data.discount || 0,
        discountType: data.discountType || 'amount',
        tax: data.tax || 0,
        total: data.total,
        paymentMethod: data.paymentMethod,
        paidAmount: data.paidAmount,
        changeAmount: data.changeAmount || 0,
        creditAmount: data.creditAmount || 0,
        notes: data.notes,
      }).returning();

      // Create bill items and update stock
      for (const item of data.items) {
        await tx.insert(schema.billItems).values({
          billId: bill.id,
          productId: item.productId,
          productName: item.productName,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          discount: item.discount || 0,
          subtotal: item.subtotal,
        });

        // Update product stock
        const product = await tx.select().from(schema.products)
          .where(eq(schema.products.id, item.productId))
          .get();

        if (product) {
          const newStock = product.currentStock - item.quantity;

          await tx.update(schema.products)
            .set({ currentStock: newStock })
            .where(eq(schema.products.id, item.productId));

          // Log stock change
          await tx.insert(schema.stockLogs).values({
            productId: item.productId,
            type: 'sale',
            quantity: -item.quantity,
            previousStock: product.currentStock,
            newStock: newStock,
            userId: data.userId,
            referenceId: bill.id,
          });
        }
      }

      // Update customer credit if applicable
      if (data.creditAmount > 0 && data.customerId) {
        await tx.update(schema.customers)
          .set({
            currentCredit: sql`${schema.customers.currentCredit} + ${data.creditAmount}`,
          })
          .where(eq(schema.customers.id, data.customerId));
      }

      // Update customer loyalty points
      if (data.customerId) {
        const pointsToAdd = Math.floor(data.total / 100);
        await tx.update(schema.customers)
          .set({
            loyaltyPoints: sql`${schema.customers.loyaltyPoints} + ${pointsToAdd}`,
          })
          .where(eq(schema.customers.id, data.customerId));
      }

      return bill;
    });

    return { success: true, data: result };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getAll', async (_, filters?: any) => {
  try {
    let query = db.select().from(schema.bills).orderBy(desc(schema.bills.createdAt));

    if (filters?.startDate && filters?.endDate) {
      query = query.where(
        and(
          sql`${schema.bills.createdAt} >= ${filters.startDate}`,
          sql`${schema.bills.createdAt} <= ${filters.endDate}`
        )
      ) as any;
    }

    const bills = await query.all();
    return { success: true, data: bills };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getById', async (_, id: number) => {
  try {
    const bill = await db.select().from(schema.bills)
      .where(eq(schema.bills.id, id))
      .get();

    const items = await db.select().from(schema.billItems)
      .where(eq(schema.billItems.billId, id))
      .all();

    return { success: true, data: { ...bill, items } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getByNumber', async (_, billNumber: string) => {
  try {
    const bill = await db.select().from(schema.bills)
      .where(eq(schema.bills.billNumber, billNumber))
      .get();

    if (bill) {
      const items = await db.select().from(schema.billItems)
        .where(eq(schema.billItems.billId, bill.id))
        .all();

      return { success: true, data: { ...bill, items } };
    }

    return { success: false, error: 'Bill not found' };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getHeld', async () => {
  try {
    const bills = await db.select().from(schema.bills)
      .where(eq(schema.bills.isHeld, true))
      .all();
    return { success: true, data: bills };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:hold', async (_, data: any) => {
  try {
    const billNumber = generateBillNumber();
    const [bill] = await db.insert(schema.bills).values({
      ...data,
      billNumber,
      isHeld: true,
      status: 'held',
    }).returning();

    // Save bill items
    for (const item of data.items) {
      await db.insert(schema.billItems).values({
        billId: bill.id,
        ...item,
      });
    }

    return { success: true, data: bill };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:resume', async (_, id: number) => {
  try {
    const bill = await db.select().from(schema.bills)
      .where(eq(schema.bills.id, id))
      .get();

    const items = await db.select().from(schema.billItems)
      .where(eq(schema.billItems.billId, id))
      .all();

    return { success: true, data: { ...bill, items } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
