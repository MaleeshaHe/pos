import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, and, desc, sql } from 'drizzle-orm';
import { safeHandle } from './ipcHelpers';

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

safeHandle('bills:create', async (_, data: any) => {
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

safeHandle('bills:getAll', async (_, filters?: any) => {
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

safeHandle('bills:getById', async (_, id: number) => {
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

safeHandle('bills:getByNumber', async (_, billNumber: string) => {
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

safeHandle('bills:getHeld', async () => {
  try {
    const bills = await db.select().from(schema.bills)
      .where(eq(schema.bills.isHeld, true))
      .all();
    return { success: true, data: bills };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

safeHandle('bills:hold', async (_, data: any) => {
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

safeHandle('bills:resume', async (_, id: number) => {
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

ipcMain.handle('bills:getItems', async (_, billId: number) => {
  try {
    const items = await db.select().from(schema.billItems)
      .where(eq(schema.billItems.billId, billId))
      .all();

    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('bills:getByCustomer', async (_, customerId: number) => {
  try {
    // Get last 5 bills for this customer
    const bills = await db.select().from(schema.bills)
      .where(eq(schema.bills.customerId, customerId))
      .orderBy(desc(schema.bills.createdAt))
      .limit(5)
      .all();

    // Get items for each bill
    const billsWithItems = await Promise.all(
      bills.map(async (bill) => {
        const items = await db.select().from(schema.billItems)
          .where(eq(schema.billItems.billId, bill.id))
          .all();

        return { ...bill, items };
      })
    );

    return { success: true, data: billsWithItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Hold a bill (save as draft)
ipcMain.handle('bills:hold', async (_, data: any) => {
  try {
    const billNumber = generateBillNumber();

    // Create bill with isHeld = true
    const [bill] = await db.insert(schema.bills).values({
      billNumber,
      customerId: data.customerId,
      userId: data.userId,
      subtotal: data.subtotal,
      discount: data.discount || 0,
      discountType: data.discountType || 'amount',
      tax: data.tax || 0,
      total: data.total,
      paymentMethod: data.paymentMethod || 'cash',
      paidAmount: 0,
      changeAmount: 0,
      creditAmount: 0,
      isHeld: true, // Mark as held
      notes: data.notes,
    }).returning();

    // Create bill items (don't update stock for held bills)
    for (const item of data.items) {
      await db.insert(schema.billItems).values({
        billId: bill.id,
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount || 0,
        subtotal: item.subtotal,
      });
    }

    return { success: true, data: bill };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get all held bills
ipcMain.handle('bills:getHeld', async () => {
  try {
    const bills = await db.select().from(schema.bills)
      .where(eq(schema.bills.isHeld, true))
      .orderBy(desc(schema.bills.createdAt))
      .all();

    // Get items for each bill
    const billsWithItems = await Promise.all(
      bills.map(async (bill) => {
        const items = await db.select().from(schema.billItems)
          .where(eq(schema.billItems.billId, bill.id))
          .all();

        return { ...bill, items };
      })
    );

    return { success: true, data: billsWithItems };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Resume a held bill
ipcMain.handle('bills:resume', async (_, billId: number) => {
  try {
    // Get the held bill with items
    const bill = await db.select().from(schema.bills)
      .where(and(eq(schema.bills.id, billId), eq(schema.bills.isHeld, true)))
      .get();

    if (!bill) {
      return { success: false, error: 'Held bill not found' };
    }

    const items = await db.select().from(schema.billItems)
      .where(eq(schema.billItems.billId, billId))
      .all();

    // Return bill with items
    return { success: true, data: { ...bill, items } };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Delete a held bill
ipcMain.handle('bills:deleteHeld', async (_, billId: number) => {
  try {
    // First delete all bill items
    await db.delete(schema.billItems)
      .where(eq(schema.billItems.billId, billId));

    // Then delete the bill
    await db.delete(schema.bills)
      .where(and(eq(schema.bills.id, billId), eq(schema.bills.isHeld, true)));

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
