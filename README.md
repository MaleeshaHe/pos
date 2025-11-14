# Premium POS System

A high-performance, offline-first Point of Sale desktop application built with Electron, React, TypeScript, SQLite, and Drizzle ORM.

## Features

### Core Modules

- **Sales & Billing (POS Screen)** - Fast barcode scanning, instant billing, multiple payment methods
- **Inventory Management** - Complete product catalog, stock tracking, low stock alerts
- **Customer Management** - Customer profiles, credit management, loyalty points
- **Dashboard & Analytics** - Real-time insights, sales charts, performance metrics
- **Reports** - Comprehensive reporting system (Sales, Inventory, Credit, P&L)
- **Settings** - Configurable store settings, language support (English/Sinhala)

### Key Capabilities

- **Offline-first** - Works completely offline with local SQLite database
- **Bilingual Support** - English and Sinhala (සිංහල) UI
- **Fast Performance** - Optimized for quick billing and instant product lookup
- **Multi-payment** - Cash, Card, Credit, and Split payments
- **Credit System** - Customer credit management with payment tracking
- **Loyalty Program** - Points-based customer rewards
- **Stock Management** - Real-time stock updates, batch tracking
- **User Roles** - Admin, Manager, Cashier with permission-based access

## Tech Stack

- **Frontend**: React 18 + TypeScript + Tailwind CSS
- **Desktop**: Electron 28
- **Database**: SQLite (better-sqlite3) + Drizzle ORM
- **Build Tool**: Vite
- **State Management**: Zustand
- **UI Icons**: Lucide React
- **Notifications**: React Hot Toast

## Prerequisites

- Node.js 18+
- npm or yarn

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd pos
```

2. Install dependencies:
```bash
npm install
```

3. Generate database schema:
```bash
npm run db:generate
```

## Development

Start the development server:
```bash
npm run dev
```

This will:
- Start Vite dev server on http://localhost:5173
- Launch Electron app with hot reload
- Auto-seed the database with initial data

### Default Login Credentials

**Admin Account:**
- Username: `admin`
- Password: `admin123`

**Cashier Account:**
- Username: `cashier`
- Password: `cashier123`

## Build

Build for production:

```bash
# Build for all platforms
npm run build

# Build for specific platform
npm run build:win    # Windows
npm run build:mac    # macOS
npm run build:linux  # Linux
```

Built applications will be in the `release/` directory.

## Database

The application uses SQLite with Drizzle ORM for type-safe database operations.

### Database Commands

```bash
# Generate migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (Database GUI)
npm run db:studio
```

### Database Location

Development: `<app-data>/pos-database.db`
- Windows: `%APPDATA%/premium-pos-system/pos-database.db`
- macOS: `~/Library/Application Support/premium-pos-system/pos-database.db`
- Linux: `~/.config/premium-pos-system/pos-database.db`

## Project Structure

```
pos/
├── src/
│   ├── main/              # Electron main process
│   │   ├── db/           # Database configuration
│   │   │   ├── schema.ts # Database schema
│   │   │   ├── index.ts  # Database connection
│   │   │   └── seed.ts   # Initial data seeding
│   │   ├── ipc/          # IPC handlers
│   │   ├── main.ts       # Main entry point
│   │   └── preload.ts    # Preload script
│   │
│   └── renderer/          # React frontend
│       ├── components/   # Reusable components
│       ├── pages/        # Page components
│       ├── stores/       # Zustand state stores
│       ├── App.tsx       # Main App component
│       └── main.tsx      # React entry point
│
├── drizzle/              # Database migrations
├── build/                # Build resources (icons, etc.)
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Features Roadmap

### Phase 1 (Current) ✅
- [x] Basic POS billing
- [x] Product management
- [x] Customer management
- [x] Dashboard
- [x] Settings
- [x] User authentication

### Phase 2 (Next)
- [ ] Barcode scanner integration
- [ ] Thermal receipt printing
- [ ] Hold & resume bills
- [ ] Product variants (size, color)
- [ ] Advanced reports
- [ ] Expense tracking

### Phase 3 (Future)
- [ ] Multi-branch support
- [ ] Supplier & purchase management
- [ ] Promotions & discounts engine
- [ ] Cloud backup & sync
- [ ] Mobile companion app
- [ ] Advanced analytics & AI insights

## Database Schema

### Core Tables

- `users` - User accounts with role-based access
- `products` - Product catalog with inventory
- `categories` - Product categorization
- `brands` - Product brands
- `customers` - Customer profiles and loyalty
- `bills` - Sales transactions
- `billItems` - Line items in bills
- `creditPayments` - Customer credit payments
- `suppliers` - Supplier information
- `purchases` - Purchase orders
- `expenses` - Business expenses
- `settings` - System configuration
- `activityLogs` - Audit trail

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please open an issue on GitHub.

## Acknowledgments

Built with modern web technologies to provide a fast, reliable, and offline-capable POS solution for retail businesses.
