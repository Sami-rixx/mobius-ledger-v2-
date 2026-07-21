# Mobius Ledger v2

A modern, production-quality financial management system for small and medium private schools.

## Philosophy

Built under **M\u00f6bius Muse** - "Making Ideas Inevitable."
Every feature feels intentional, clean, and effortless to use.

## Features

- **Dashboard**: Real-time financial overview
- **Student Management**: Complete student records
- **School Fees**: Individual ledgers, partial payments, arrears tracking
- **Lunch Management**: Daily/weekly/monthly payments with attendance tracking
- **Income & Expense Management**: Custom categories, detailed records
- **Director Withdrawals**: Track management withdrawals
- **Daily Ledger**: Complete daily financial records
- **Reports**: Daily, weekly, monthly, annual reports
- **Audit Trail**: Complete history of all changes
- **Receipts**: Unique, sequential receipt numbers

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Database | SQLite (with PostgreSQL migration path) |
| Styling | SCSS (Custom Design System) |

## Project Structure

```
mobius-ledger-v2/
├── backend/               # Node.js/Express API
│   ├── src/
│   │   ├── config/        # Database, constants
│   │   ├── controllers/   # Route handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API endpoints
│   │   ├── services/      # Business logic
│   │   ├── utils/         # Helpers
│   │   └── app.js         # Express setup
│   └── package.json
│
├── frontend/              # React + Vite
│   ├── src/
│   │   ├── components/    # Reusable UI
│   │   ├── pages/         # Page components
│   │   ├── hooks/         # Custom hooks
│   │   ├── services/      # API clients
│   │   ├── utils/         # Utilities
│   │   ├── styles/        # SCSS files
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── database/
│   ├── schema.sql         # Database schema
│   ├── setup.js           # Database initialization
│   └── seed.js            # Demo data
│
├── .gitignore
├── README.md
└── package.json           # Root (optional)
```

## Setup Instructions

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- Git

### Termux (Android) Setup

```bash
# Install Node.js and npm
pkg install nodejs

# Clone the repository
git clone https://github.com/Sami-rixx/mobius-ledger-v2-.git
cd mobius-ledger-v2-

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### Local Development Setup

```bash
# Clone the repository
git clone https://github.com/Sami-rixx/mobius-ledger-v2-.git
cd mobius-ledger-v2-

# Install all dependencies
npm install
cd backend && npm install
cd ../frontend && npm install
```

### Running the Application

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

- Backend runs on: `http://localhost:3000`
- Frontend runs on: `http://localhost:5173`

### Database Setup

```bash
# Initialize the database
cd backend
npm run db:setup

# Seed with demo data
node ../database/seed.js
```

### Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=3000
FRONTEND_URL=http://localhost:5173
NODE_ENV=development
```

## Development Workflow

1. **Work in small milestones**
2. **Test on mobile** before considering complete
3. **Commit frequently** with clear messages
4. **Push to GitHub** after each milestone

### Git Workflow

```bash
# Create a feature branch
git checkout -b feat/dashboard

# Make changes, then commit
git add .
git commit -m "feat: add dashboard with summary cards"

# Push to GitHub
git push origin feat/dashboard
```

## Design Principles

### Colors
- **Primary**: Brown (#8B4513)
- **Neutral**: Black (#000000), White (#FFFFFF)
- **Accent**: Use brown sparingly as accent
- **Background**: Light gray (#F5F5F5)

### Typography
- Font Family: Segoe UI, system fonts
- Base Size: 16px
- Line Height: 1.5

### Spacing
- Base Unit: 4px
- Scale: xs (4px), sm (8px), md (16px), lg (24px), xl (32px), 2xl (48px)

### Mobile First
- All components designed for mobile first
- Responsive breakpoints: 640px, 1024px, 1280px
- Touch-friendly buttons (minimum 44x44px)
- No horizontal scrolling

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/students` | List all students |
| POST | `/api/students` | Create a student |
| GET | `/api/students/:id` | Get student details |
| PUT | `/api/students/:id` | Update a student |
| DELETE | `/api/students/:id` | Delete a student |

## Testing

### Backend Tests
```bash
cd backend
npm test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## Future Enhancements

- [ ] Authentication & Authorization
- [ ] Payroll Management
- [ ] Inventory Management
- [ ] Supplier Management
- [ ] Budget Planning
- [ ] Banking Reconciliation
- [ ] Multi-school Support
- [ ] User Roles & Permissions
- [ ] SMS & Email Notifications
- [ ] Parent Portal
- [ ] Analytics Dashboard

## License

MIT License - Copyright (c) 2026 Sami-rixx

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues or questions, please open a GitHub issue.
