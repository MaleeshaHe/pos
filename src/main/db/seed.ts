import { getDatabase, schema } from './index';
import { app } from 'electron';
import crypto from 'crypto';

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export async function seedDatabase() {
  const db = getDatabase();

  try {
    // Check if admin user exists
    const existingAdmin = await db.select().from(schema.users).where(
      (users) => users.username === 'admin'
    ).get();

    if (existingAdmin) {
      console.log('Database already seeded');
      return;
    }

    console.log('Seeding database...');

    // Create default admin user
    await db.insert(schema.users).values({
      username: 'admin',
      password: hashPassword('admin123'),
      fullName: 'System Administrator',
      role: 'admin',
      email: 'admin@pos.com',
      isActive: true,
    });

    // Create default cashier
    await db.insert(schema.users).values({
      username: 'cashier',
      password: hashPassword('cashier123'),
      fullName: 'Cashier User',
      role: 'cashier',
      isActive: true,
    });

    // Create default categories
    const categoryIds = await db.insert(schema.categories).values([
      { name: 'Electronics', nameSi: 'ඉලෙක්ට්‍රොනික්', description: 'Electronic items' },
      { name: 'Groceries', nameSi: 'සිල්ලර බඩු', description: 'Food and grocery items' },
      { name: 'Clothing', nameSi: 'ඇඳුම්', description: 'Apparel and clothing' },
      { name: 'Hardware', nameSi: 'දෘඩාංග', description: 'Hardware and tools' },
      { name: 'Pharmacy', nameSi: 'ඖෂධ', description: 'Medical and pharmacy items' },
    ]).returning({ id: schema.categories.id });

    // Create default brands
    await db.insert(schema.brands).values([
      { name: 'Generic', description: 'Generic brand' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Apple', description: 'Apple Inc.' },
      { name: 'Nokia', description: 'Nokia Corporation' },
    ]);

    // Create default expense categories
    await db.insert(schema.expenseCategories).values([
      { name: 'Utilities', nameSi: 'උපයෝගිතා', description: 'Electricity, water, etc.' },
      { name: 'Rent', nameSi: 'කුලිය', description: 'Shop rent' },
      { name: 'Salaries', nameSi: 'වැටුප්', description: 'Employee salaries' },
      { name: 'Maintenance', nameSi: 'නඩත්තුව', description: 'Maintenance and repairs' },
      { name: 'Other', nameSi: 'වෙනත්', description: 'Other expenses' },
    ]);

    // Create default settings
    await db.insert(schema.settings).values([
      { key: 'store_name', value: 'Premium POS Store' },
      { key: 'store_address', value: 'Colombo, Sri Lanka' },
      { key: 'store_phone', value: '+94 11 234 5678' },
      { key: 'currency', value: 'LKR' },
      { key: 'language', value: 'en' },
      { key: 'tax_rate', value: '0' },
      { key: 'receipt_footer', value: 'Thank you for your business!' },
      { key: 'loyalty_points_rate', value: '1' }, // 1 point per LKR 100
      { key: 'low_stock_alert', value: '10' },
    ]);

    // Create a sample customer
    await db.insert(schema.customers).values({
      name: 'Walk-in Customer',
      phone: null,
      creditLimit: 0,
      currentCredit: 0,
      isActive: true,
    });

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}
