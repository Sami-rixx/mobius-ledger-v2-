# Mobius Ledger v2

A modern, production-quality financial management system for small and medium private schools.

## Philosophy

Built under **Möbius Muse** - "Making Ideas Inevitable."

Every feature feels intentional, clean, and effortless to use. The system prioritizes:

1. **Correctness** - Financial integrity above all else
2. **Reliability** - The system must work consistently
3. **Maintainability** - Code must be readable and modifiable
4. **Production Quality** - Built for real-world daily use
5. **Mobile-First** - Every feature must work on mobile browsers

---

## Features

- **Dashboard**: Real-time financial overview
- **Student Management**: Complete student records with class assignments
- **Class Management**: School classes/grades management
- **School Fees**: Individual ledgers, partial payments, arrears tracking
- **Lunch Management**: Daily/weekly/monthly payments with attendance tracking
- **Student Charges**: Custom charges (swimming, trips, sports, etc.)
- **Income Management**: Category-based income tracking
- **Expense Management**: Hierarchical expense categories
- **Director Withdrawals**: Track management withdrawals
- **Daily Ledger**: Complete daily financial records
- **Transactions**: Unified transaction management
- **Reports**: Daily, weekly, monthly, annual reports
- **Audit Trail**: Complete history of all changes
- **Receipts**: Unique, sequential receipt numbers
- **Data Import/Export**: Backup and restore functionality

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Node.js + Express |
| Database | SQLite (with PostgreSQL migration path) |
| Frontend | React 18 + Vite |
| Styling | SCSS (Custom Design System) |

---

## Project Structure

```
mobius-ledger-v2/
├── backend/               # Node.js/Express API
│   └── src/
│       ├── config/        # Database, constants
│       ├── controllers/   # Route handlers
│       ├── models/        # Database models
│       ├── routes/        # API endpoints
│       ├── services/      # Business logic
│       ├── utils/         # Helpers
│       └── app.js         # Express setup
│
├── frontend/              # React + Vite
│   └── src/
│       ├── components/    # Reusable UI
│       ├── pages/         # Page components
│       ├── services/      # API clients
│       └── styles/        # SCSS styles
│
├── database/              # Database files
│   ├── schema.sql         # Database schema
│   └── setup.js           # Database setup
│
└── root files            # Documentation
    ├── README.md          # This file
    ├── ARCHITECTURE.md    # Architecture & patterns
    ├── CURRENT_MILESTONE.md # Current development priority
    ├── MODULE_STATUS.md   # All modules status
    ├── PROJECT_STATUS.md  # Project status
    ├── SESSION_HANDOFF.md  # Session documentation
    └── DEVELOPMENT_ROADMAP.md # Complete roadmap
```

---

## Setup Instructions

### Prerequisites

- Node.js (v22+ recommended)
- npm (v10+)
- Git

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/Sami-rixx/mobius-ledger-v2-.git
   cd mobius-ledger-v2-
   ```

2. **Install backend dependencies**:
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**:
   ```bash
   cd ../frontend
   npm install
   ```

4. **Setup database**:
   ```bash
   cd ../database
   node setup.js
   ```

5. **Copy database to backend for tests**:
   ```bash
   cp mobius_ledger.db ../backend/src/__tests__/test_mobius_ledger.db
   ```

---

## Running the Application

### Backend

```bash
cd backend
node src/app.js
```

The backend will start on port 3000 by default.

**Endpoints**:
- Health check: `http://localhost:3000/api/health`
- API root: `http://localhost:3000/`

### Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on port 5173 by default.

**URL**: `http://localhost:5173`

### Production Build

```bash
cd frontend
npm run build
```

This creates a production-ready build in the `dist/` folder.

---

## Running Tests

### Backend Tests

```bash
cd backend
npm test
```

This runs all Jest tests for the backend.

### Frontend Build Verification

```bash
cd frontend
npm run build
```

A successful build indicates the frontend is working correctly.

---

## Documentation System

This project uses a comprehensive self-documenting system. **Every developer and AI session must read these files before writing code:**

### 📋 Essential Reading (Read Before Every Session)

1. **CURRENT_MILESTONE.md** - Single source of truth for what to work on next
   - Current milestone and phase
   - Last completed phase
   - Next actionable task
   - Planned files for next phase
   - Verification checklist

2. **MODULE_STATUS.md** - Complete status of all system modules
   - Status of every module (Foundation, Students, Classes, Fees, etc.)
   - Completion percentage
   - Backend/Frontend status
   - Latest commit for each module
   - Next planned work

3. **ARCHITECTURE.md** - Architecture and implementation rules
   - Project philosophy
   - Technology stack
   - Folder structure
   - Layer responsibilities
   - Clean Architecture rules
   - Naming conventions
   - Coding standards
   - Git workflow
   - Documentation workflow
   - Testing strategy
   - Financial integrity principles
   - Mobile-first requirements
   - Module implementation template
   - Development workflow
   - Repository governance

4. **DEVELOPMENT_ROADMAP.md** - Complete project roadmap
   - All milestones with detailed breakdowns
   - Dependencies between milestones
   - Estimated timeline
   - Completion checklist

### 📊 Status Tracking

5. **PROJECT_STATUS.md** - High-level project status
   - Current milestone
   - Overall status
   - Latest commit
   - Next milestone

6. **SESSION_HANDOFF.md** - Previous session details
   - What was completed
   - Files created/modified
   - Commit history
   - Next steps

---

## Development Workflow

The standard implementation workflow for every feature:

```
Inspect
    ↓
Plan
    ↓
Implement
    ↓
Verify
    ↓
Test
    ↓
Update Documentation
    ↓
Commit
    ↓
Push
```

### Before Writing Code

Every session must:

1. ✅ Pull latest changes from GitHub
2. ✅ Read README.md
3. ✅ Read ARCHITECTURE.md
4. ✅ Read CURRENT_MILESTONE.md
5. ✅ Read MODULE_STATUS.md
6. ✅ Read PROJECT_STATUS.md
7. ✅ Read SESSION_HANDOFF.md
8. ✅ Read DEVELOPMENT_ROADMAP.md
9. ✅ Inspect repository structure
10. ✅ Identify next task from CURRENT_MILESTONE.md

### After Completing Work

Every completed feature requires:

1. ✅ Implementation complete
2. ✅ Verification complete
3. ✅ Tests pass
4. ✅ Production build succeeds
5. ✅ PROJECT_STATUS.md updated
6. ✅ SESSION_HANDOFF.md updated
7. ✅ CURRENT_MILESTONE.md updated
8. ✅ MODULE_STATUS.md updated (if module status changed)
9. ✅ Commit created with descriptive message
10. ✅ Push to GitHub confirmed

---

## Repository Governance

### Single Source of Truth

**GitHub is the permanent source of truth.**

- The repository state on GitHub is canonical
- Local sandbox work is temporary
- **Never leave completed work only in the sandbox**
- **Always commit and push after every completed phase**

### Documentation Principles

- Documentation must always match the repository state
- Documentation must be internally consistent
- Cross-references between documents must be correct
- Update documentation after every completed phase

### Work Completion Requirements

Every completed feature requires all 10 steps in the workflow above. **Never skip any step.**

---

## Clean Architecture Rules

### Layer Responsibilities

- **Controllers**: Handle HTTP requests/responses only
- **Services**: Contain all business logic
- **Models**: Perform database operations only
- **Components**: Render UI only
- **Pages**: Compose components and call services only

### Dependency Direction

```
Controllers → Services → Models → Database
Pages → Services → Components
```

**Never reverse these dependencies.**

### Business Logic Location

- ✅ **DO**: Put business logic in Services
- ❌ **DON'T**: Put business logic in Controllers
- ❌ **DON'T**: Put business logic in Models
- ❌ **DON'T**: Put business logic in UI Components
- ❌ **DON'T**: Put business logic in Pages

---

## Financial Integrity Rules

This application manages real money. Therefore:

1. **Receipt numbers must remain unique**
2. **No duplicate transactions**
3. **No orphan records**
4. **Preserve referential integrity**
5. **Transactions must be atomic where appropriate**
6. **Balances must always remain consistent**
7. **Never silently discard financial data**
8. **Validate all monetary input**
9. **Store monetary values consistently**

### Implementation Guidelines

- Financial calculations belong in **Services**
- Financial validation belongs in **Services** and **Controllers**
- Financial data storage belongs in **Models**
- Financial display belongs in **Components**
- **Never perform calculations in UI components**

---

## Mobile-First Requirements

Every feature must work correctly on Android mobile browsers.

### Requirements

- Responsive layouts
- No horizontal overflow
- Touch-friendly controls (minimum 44x44px)
- Responsive tables
- Good performance on low-end devices
- Support slower network connections
- Avoid designs that only work on desktop
- Never introduce blank-screen rendering issues

---

## Current Status

For the most up-to-date status, see:

- **CURRENT_MILESTONE.md** - What to work on next
- **MODULE_STATUS.md** - Status of all modules
- **PROJECT_STATUS.md** - High-level project status

---

## Getting Help

1. Read all documentation files
2. Check CURRENT_MILESTONE.md for next task
3. Check MODULE_STATUS.md for module context
4. Check git history for recent changes
5. Check GitHub for latest commits

---

## Contributing

1. Follow the development workflow
2. Follow Clean Architecture rules
3. Follow naming conventions
4. Follow coding standards
5. Update documentation
6. Commit and push frequently

---

## License

Private - Möbius Muse

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.0.0 | 2026-07-23 | Added comprehensive documentation system |
| 1.0.0 | 2026-07-21 | Initial project foundation |
