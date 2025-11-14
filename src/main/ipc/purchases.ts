import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq } from 'drizzle-orm';

const db = getDatabase();

// Get all purchases
ipcMain.handle('purchases:getAll', async () => {
  try {
    const purchases = await db.select().from(schema.purchases).all();
    return { success: true, data: purchases };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get purchase by ID
ipcMain.handle('purchases:getById', async (_, id: number) => {
  try {
    const purchase = await db.select().from(schema.purchases)
      .where(eq(schema.purchases.id, id))
      .get();
    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Create purchase with items
ipcMain.handle('purchases:create', async (_, data: any) => {
  try {
    const { items, ...purchaseData } = data;

    // Insert purchase
    const purchaseResult = await db.insert(schema.purchases).values(purchaseData).returning();
    const purchase = purchaseResult[0];

    // Insert purchase items
    if (items && items.length > 0) {
      const itemsWithPurchaseId = items.map((item: any) => ({
        ...item,
        purchaseId: purchase.id,
      }));

      await db.insert(schema.purchaseItems).values(itemsWithPurchaseId);
    }

    return { success: true, data: purchase };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Update purchase
ipcMain.handle('purchases:update', async (_, id: number, data: any) => {
  try {
    const result = await db.update(schema.purchases)
      .set(data)
      .where(eq(schema.purchases.id, id))
      .returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get purchase items
ipcMain.handle('purchases:getItems', async (_, purchaseId: number) => {
  try {
    const items = await db.select().from(schema.purchaseItems)
      .where(eq(schema.purchaseItems.purchaseId, purchaseId))
      .all();
    return { success: true, data: items };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Create stock log
ipcMain.handle('stockLogs:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.stockLogs).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
