import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { eq, like, or, sql } from 'drizzle-orm';

const db = getDatabase();

// Get all products
ipcMain.handle('products:getAll', async () => {
  try {
    const products = await db.select().from(schema.products)
      .where(eq(schema.products.isActive, true))
      .all();
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get product by ID
ipcMain.handle('products:getById', async (_, id: number) => {
  try {
    const product = await db.select().from(schema.products)
      .where(eq(schema.products.id, id))
      .get();
    return { success: true, data: product };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Search products
ipcMain.handle('products:search', async (_, query: string) => {
  try {
    const products = await db.select().from(schema.products)
      .where(
        or(
          like(schema.products.name, `%${query}%`),
          like(schema.products.nameSi, `%${query}%`),
          like(schema.products.barcode, `%${query}%`),
          like(schema.products.sku, `%${query}%`)
        )
      )
      .limit(20)
      .all();
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Create product
ipcMain.handle('products:create', async (_, data: any) => {
  try {
    const result = await db.insert(schema.products).values(data).returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Update product
ipcMain.handle('products:update', async (_, id: number, data: any) => {
  try {
    const result = await db.update(schema.products)
      .set({ ...data, updatedAt: new Date().toISOString() })
      .where(eq(schema.products.id, id))
      .returning();
    return { success: true, data: result[0] };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Delete product (soft delete)
ipcMain.handle('products:delete', async (_, id: number) => {
  try {
    await db.update(schema.products)
      .set({ isActive: false })
      .where(eq(schema.products.id, id));
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

// Get low stock products
ipcMain.handle('products:getLowStock', async () => {
  try {
    const products = await db.select().from(schema.products)
      .where(
        sql`${schema.products.currentStock} <= ${schema.products.reorderLevel} AND ${schema.products.isActive} = 1`
      )
      .all();
    return { success: true, data: products };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
