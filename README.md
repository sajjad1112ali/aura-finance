# Aura Finance

A personal finance management dashboard for tracking income, expenses, and recurring transactions with beautiful visualizations and insights.

## Project Description

Aura Finance is a local-first personal finance tracker that helps you manage your personal finances with ease. Track income and expenses, categorize transactions, set up recurring payments, and generate detailed reports. All data is stored locally in your browser using localStorage.

## Features

- **Transaction Management** — Add, edit, and delete income/expense transactions with categories
- **Dashboard Overview** — View financial summary with income, expenses, balance, and transaction count
- **Visual Analytics** — Interactive pie charts for spending breakdown and bar charts for income vs expenses trends
- **Recurring Transactions** — Auto-generate recurring income/expenses (daily, weekly, monthly)
- **Category Management** — Create custom categories with icons and colors
- **Date Filtering** — Browse transactions by date range with month navigation
- **Export Reports** — Export transactions to CSV or PDF format
- **Authentication** — Simple local authentication to protect your data

## Technologies Used

### Core

- **React 18** — UI library
- **TypeScript** — Type safety
- **Vite** — Build tool

### Frontend & UI

- **TailwindCSS** — Styling
- **shadcn/ui** — Component library (Radix UI based)
- **Framer Motion** — Animations
- **Lucide React** — Icons

### State & Data

- **Zustand** — Global state management
- **TanStack Query** — Data fetching/caching
- **React Router DOM** — Routing

### Forms & Validation

- **React Hook Form** — Form handling
- **Zod** — Schema validation

### Charts & Reports

- **Recharts** — Data visualization
- **jsPDF + jspdf-autotable** — PDF export

### Utilities

- **date-fns** — Date manipulation

## Key Highlights

### Dashboard

The main dashboard displays:

- Total income, expenses, and balance for the selected month
- 6-month income vs expenses bar chart
- Spending breakdown pie chart by category
- Quick access to transaction counts

### Recurring Transactions

Set up recurring rules that automatically generate transactions:

- Daily, weekly, or monthly frequency
- Auto-posting based on due dates
- Manual posting with one click

### Export

Export full transaction history to:

- **CSV** — Compatible with Excel/Google Sheets
- **PDF** — Formatted report with totals and charts

## Installation & Setup

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/sajjad1112ali/aura-finance.git
cd aura-finance

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Building

```bash
# Production build
pnpm build

# Preview production build
pnpm preview
```

### Testing

```bash
# Run tests
pnpm test

# Watch mode
pnpm test:watch
```

### Linting

```bash
# Run ESLint
pnpm lint
```

## Usage

1. **First Launch** — Create an account to secure your data
2. **Add Transactions** — Click the + button to add income or expenses
3. **Set Categories** — Create categories for different expense types (Food, Transport, etc.)
4. **View Dashboard** — See your financial overview with monthly summaries
5. **Set Recurring** — Automate recurring payments (rent, subscriptions, salary)
6. **Export** — Download reports for tax or record-keeping

## Folder Structure

```
src/
├── components/          # Reusable UI components
│   └── ui/             # shadcn/ui components
├── features/           # Feature-based modules
│   ├── auth/          # Authentication
│   ├── categories/   # Category management
│   ├── dashboard/    # Dashboard & charts
│   ├── export/       # Export functionality
│   ├── recurring/    # Recurring transactions
│   └── transactions/ # Transaction CRUD
├── hooks/              # Custom React hooks
├── lib/               # Utility functions
├── pages/             # Route pages
├── services/          # Storage & export services
├── store/            # Zustand stores
└── types/             # TypeScript types
```

## Future Improvements

- **Data Backup/Restore** — Import/export JSON backup
- **Multi-Currency Support** — Handle multiple currencies
- **Budget Setting** — Set monthly budgets per category
- **PWA Support** — Install as native app
- **Charts Time Range** — Customizable chart periods
- **Data Persistence** — Backend integration option

## Contributing

Contributions are welcome! Please read the existing code style before submitting PRs.

## License

MIT License — feel free to use for personal or commercial projects.
