import { ipcMain } from 'electron';
import { getDatabase, schema } from '../db';
import { sql, gte } from 'drizzle-orm';

const db = getDatabase();

ipcMain.handle('dashboard:getStats', async () => {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Today's sales
    const todaySales = await db.select({
      total: sql<number>`SUM(${schema.bills.total})`,
      count: sql<number>`COUNT(*)`,
    }).from(schema.bills)
      .where(sql`DATE(${schema.bills.createdAt}) = ${today}`)
      .get();

    // Total products
    const totalProducts = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(schema.products)
      .where(sql`${schema.products.isActive} = 1`)
      .get();

    // Low stock products
    const lowStockCount = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(schema.products)
      .where(sql`${schema.products.currentStock} <= ${schema.products.reorderLevel} AND ${schema.products.isActive} = 1`)
      .get();

    // Total customers
    const totalCustomers = await db.select({
      count: sql<number>`COUNT(*)`,
    }).from(schema.customers)
      .where(sql`${schema.customers.isActive} = 1`)
      .get();

    // Total credit amount
    const totalCredit = await db.select({
      total: sql<number>`SUM(${schema.customers.currentCredit})`,
    }).from(schema.customers).get();

    // Recent bills
    const recentBills = await db.select().from(schema.bills)
      .orderBy(sql`${schema.bills.createdAt} DESC`)
      .limit(5)
      .all();

    return {
      success: true,
      data: {
        todaySales: todaySales?.total || 0,
        todayTransactions: todaySales?.count || 0,
        totalProducts: totalProducts?.count || 0,
        lowStockCount: lowStockCount?.count || 0,
        totalCustomers: totalCustomers?.count || 0,
        totalCredit: totalCredit?.total || 0,
        recentBills,
      },
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('dashboard:getSalesChart', async (_, period: string) => {
  try {
    let dateFilter = '';

    if (period === 'week') {
      dateFilter = `DATE(${schema.bills.createdAt}) >= DATE('now', '-7 days')`;
    } else if (period === 'month') {
      dateFilter = `DATE(${schema.bills.createdAt}) >= DATE('now', '-30 days')`;
    } else {
      dateFilter = `DATE(${schema.bills.createdAt}) = DATE('now')`;
    }

    const salesData = await db.select({
      date: sql<string>`DATE(${schema.bills.createdAt})`,
      total: sql<number>`SUM(${schema.bills.total})`,
      count: sql<number>`COUNT(*)`,
    }).from(schema.bills)
      .where(sql.raw(dateFilter))
      .groupBy(sql`DATE(${schema.bills.createdAt})`)
      .all();

    return { success: true, data: salesData };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
});
