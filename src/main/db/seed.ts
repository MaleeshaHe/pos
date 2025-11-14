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
    const brandIds = await db.insert(schema.brands).values([
      { name: 'Generic', description: 'Generic brand' },
      { name: 'Samsung', description: 'Samsung Electronics' },
      { name: 'Apple', description: 'Apple Inc.' },
      { name: 'Nokia', description: 'Nokia Corporation' },
      { name: 'Anchor', description: 'Anchor Food Products' },
      { name: 'Maliban', description: 'Maliban Biscuits' },
    ]).returning({ id: schema.brands.id });

    // Create sample products
    await db.insert(schema.products).values([
      // Electronics
      {
        sku: 'ELEC001',
        barcode: '1234567890123',
        name: 'Samsung Galaxy A54',
        nameSi: 'සැම්සුං ගැලැක්සි A54',
        categoryId: categoryIds[0].id,
        brandId: brandIds[1].id,
        costPrice: 85000,
        sellingPrice: 95000,
        currentStock: 15,
        reorderLevel: 5,
        unit: 'pcs',
      },
      {
        sku: 'ELEC002',
        barcode: '1234567890124',
        name: 'USB Flash Drive 32GB',
        nameSi: 'USB පෙන්ඩ්‍රයිව් 32GB',
        categoryId: categoryIds[0].id,
        brandId: brandIds[0].id,
        costPrice: 800,
        sellingPrice: 1200,
        currentStock: 50,
        reorderLevel: 10,
        unit: 'pcs',
      },
      // Groceries
      {
        sku: 'GROC001',
        barcode: '2345678901234',
        name: 'Anchor Full Cream Milk Powder 400g',
        nameSi: 'ඇන්කර් කිරිපිටි 400g',
        categoryId: categoryIds[1].id,
        brandId: brandIds[4].id,
        costPrice: 950,
        sellingPrice: 1100,
        currentStock: 100,
        reorderLevel: 20,
        unit: 'pcs',
      },
      {
        sku: 'GROC002',
        barcode: '2345678901235',
        name: 'Maliban Marie Biscuits 400g',
        nameSi: 'මැලිබන් මාරි බිස්කට් 400g',
        categoryId: categoryIds[1].id,
        brandId: brandIds[5].id,
        costPrice: 180,
        sellingPrice: 220,
        currentStock: 200,
        reorderLevel: 30,
        unit: 'pcs',
      },
      {
        sku: 'GROC003',
        barcode: '2345678901236',
        name: 'Rice - White Samba 1kg',
        nameSi: 'සහල් - සුදු සම්බා 1kg',
        categoryId: categoryIds[1].id,
        brandId: brandIds[0].id,
        costPrice: 180,
        sellingPrice: 220,
        currentStock: 500,
        reorderLevel: 50,
        unit: 'kg',
      },
      {
        sku: 'GROC004',
        barcode: '2345678901237',
        name: 'Sugar 1kg',
        nameSi: 'සීනි 1kg',
        categoryId: categoryIds[1].id,
        brandId: brandIds[0].id,
        costPrice: 220,
        sellingPrice: 270,
        currentStock: 300,
        reorderLevel: 40,
        unit: 'kg',
      },
      // Clothing
      {
        sku: 'CLTH001',
        barcode: '3456789012345',
        name: 'Men\'s T-Shirt - Black (L)',
        nameSi: 'පිරිමි ටී ෂර්ට් - කළු (L)',
        categoryId: categoryIds[2].id,
        brandId: brandIds[0].id,
        costPrice: 450,
        sellingPrice: 750,
        currentStock: 25,
        reorderLevel: 5,
        unit: 'pcs',
      },
      {
        sku: 'CLTH002',
        barcode: '3456789012346',
        name: 'Ladies Jeans - Blue (M)',
        nameSi: 'කාන්තා ජීන්ස් - නිල් (M)',
        categoryId: categoryIds[2].id,
        brandId: brandIds[0].id,
        costPrice: 1200,
        sellingPrice: 1850,
        currentStock: 20,
        reorderLevel: 5,
        unit: 'pcs',
      },
      // Hardware
      {
        sku: 'HARD001',
        barcode: '4567890123456',
        name: 'Hammer 500g',
        nameSi: 'මිටිය 500g',
        categoryId: categoryIds[3].id,
        brandId: brandIds[0].id,
        costPrice: 380,
        sellingPrice: 550,
        currentStock: 30,
        reorderLevel: 10,
        unit: 'pcs',
      },
      {
        sku: 'HARD002',
        barcode: '4567890123457',
        name: 'Screwdriver Set',
        nameSi: 'ඉස්කුරුප්පු ඇණ හරවනය කට්ටලය',
        categoryId: categoryIds[3].id,
        brandId: brandIds[0].id,
        costPrice: 650,
        sellingPrice: 950,
        currentStock: 15,
        reorderLevel: 5,
        unit: 'pcs',
      },
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

    // Create sample customers
    await db.insert(schema.customers).values([
      {
        name: 'Walk-in Customer',
        phone: null,
        creditLimit: 0,
        currentCredit: 0,
        loyaltyPoints: 0,
        memberLevel: 'bronze',
        isActive: true,
      },
      {
        name: 'Kamal Perera',
        phone: '0771234567',
        email: 'kamal@example.com',
        address: '123 Main Street, Colombo 7',
        creditLimit: 50000,
        currentCredit: 0,
        loyaltyPoints: 250,
        memberLevel: 'silver',
        isActive: true,
      },
      {
        name: 'Nimal Silva',
        phone: '0777654321',
        address: '45 Galle Road, Dehiwala',
        creditLimit: 100000,
        currentCredit: 0,
        loyaltyPoints: 580,
        memberLevel: 'gold',
        isActive: true,
      },
      {
        name: 'Sunil Fernando',
        phone: '0712345678',
        email: 'sunil@example.com',
        address: '78 Kandy Road, Kiribathgoda',
        creditLimit: 25000,
        currentCredit: 0,
        loyaltyPoints: 120,
        memberLevel: 'bronze',
        isActive: true,
      },
    ]);

    console.log('Database seeded successfully!');
  } catch (error) {
    console.error('Seeding failed:', error);
  }
}
