# Mobius Ledger v2 - Development Roadmap

## Project Overview

**Mobius Ledger v2** is a modern, mobile-first financial management system for small and medium private schools. Built under Möbius Muse's philosophy: "Making Ideas Inevitable."

This roadmap outlines the complete development journey from foundation to production-ready deployment.

---

## Legend

- ✅ = Completed
- 🚧 = In Progress
- ⏳ = Not Started
- 🎯 = Current Focus

---

## Documentation System

This project uses a comprehensive self-documenting system. For current development priorities and module status, see:

- **CURRENT_MILESTONE.md** - Single source of truth for what to work on next
- **MODULE_STATUS.md** - Complete status of all system modules
- **ARCHITECTURE.md** - Architecture, patterns, and implementation rules
- **SESSION_HANDOFF.md** - Previous session details
- **PROJECT_STATUS.md** - High-level project status

**Every developer and AI session must read these files before writing code.**


---

## Milestone 0: Foundation Architecture

**Status**: ✅ COMPLETE  
**Commit**: b2e0b9d  
**Date**: 2026-07-21  
**Objective**: Establish complete project foundation

### Deliverables
- [x] Backend: Express.js server setup
- [x] Backend: Security middleware (helmet, cors, rate limiting)
- [x] Backend: SQLite database integration (better-sqlite3)
- [x] Backend: Health check endpoint (`/api/health`)
- [x] Backend: Database configuration with WAL mode
- [x] Backend: Receipt generator utility (ML-YYYY-######)
- [x] Backend: Error handling middleware with custom errors
- [x] Database: Complete schema (20+ tables)
- [x] Database: Triggers for automatic daily ledger updates
- [x] Database: Views for student balances and lunch arrears
- [x] Database: Indexes for query performance
- [x] Database: Setup script
- [x] Database: Seed data with sample classes and students
- [x] Frontend: React 18 + Vite configuration
- [x] Frontend: Mobile-first SCSS design system
- [x] Frontend: Reusable components (Button, Card, Input, Table)
- [x] Frontend: API client with hooks (useApi, useFetch, usePost, usePut, useDelete)
- [x] Frontend: Utility functions (formatters, validators)
- [x] Frontend: Basic routing structure
- [x] Documentation: README.md with setup instructions
- [x] Project structure following Clean Architecture

### Dependencies
- None (foundation milestone)

### Completion Checklist
- [x] Backend runs without errors
- [x] Database schema applied successfully
- [x] Health check endpoint returns 200 OK
- [x] Design system renders correctly
- [x] Reusable components work as expected
- [x] API client can make requests
- [x] Project builds successfully

---

## Milestone 1: Student Management

**Status**: 🚧 IN PROGRESS  
**Started**: 2026-07-22  
**Objective**: Complete student CRUD functionality with full backend and frontend

### Backend (🎯 Current Focus)
- [x] Student Model (`backend/src/models/Student.js`)
  - [x] CRUD operations
  - [x] Search and filtering
  - [x] Validation logic
  - [x] Pagination support
  - [x] Business rule enforcement (no deletion with transactions)
- [x] Student Service (`backend/src/services/studentService.js`)
  - [x] Business logic layer
  - [x] Data normalization
  - [x] Statistics and summaries
  - [x] Admission number validation
- [x] Student Controller (`backend/src/controllers/studentController.js`)
  - [x] Route handlers for all endpoints
  - [x] Request validation
  - [x] Error handling
- [x] Student Routes (`backend/src/routes/studentRoutes.js`)
  - [x] RESTful API endpoints
  - [x] Query parameter handling
  - [x] Route documentation
- [x] Update index files to export new modules
- [x] Mount student routes in app.js
- [ ] **Verify backend functionality**
  - [ ] Test all API endpoints
  - [ ] Verify database queries
  - [ ] Check error handling
  - [ ] Validate response formats
- [ ] **Write tests for Student module**
  - [ ] Unit tests for Model
  - [ ] Unit tests for Service
  - [ ] Integration tests for API endpoints

### Frontend
- [ ] Student List Page (`frontend/src/pages/Students/StudentListPage.jsx`)
  - [ ] Table display with pagination
  - [ ] Search functionality
  - [ ] Filter by class and status
  - [ ] Sortable columns
  - [ ] Mobile-responsive table
- [ ] Student Create Page (`frontend/src/pages/Students/StudentCreatePage.jsx`)
  - [ ] Form with all student fields
  - [ ] Validation (client-side)
  - [ ] Admission number availability check
  - [ ] Mobile-responsive form
- [ ] Student Edit Page (`frontend/src/pages/Students/StudentEditPage.jsx`)
  - [ ] Pre-filled form with existing data
  - [ ] Update functionality
  - [ ] Validation
- [ ] Student Detail Page (`frontend/src/pages/Students/StudentDetailPage.jsx`)
  - [ ] Complete student information display
  - [ ] Transaction history (if any)
  - [ ] Balance information
  - [ ] Edit and delete actions
- [ ] Student Components
  - [ ] StudentCard component
  - [ ] StudentForm component (reusable)
  - [ ] StudentSearch component
  - [ ] StudentTable component
- [ ] Update App.jsx routing
  - [ ] Add student routes
  - [ ] Add navigation links
- [ ] Update main navigation
  - [ ] Add Students link
  - [ ] Mobile-responsive navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List students (paginated) |
| GET | `/api/students/all` | List all students |
| GET | `/api/students/:id` | Get student by ID |
| GET | `/api/students/admission/:admissionNumber` | Get by admission number |
| POST | `/api/students` | Create student |
| PUT | `/api/students/:id` | Update student (full) |
| PATCH | `/api/students/:id` | Update student (partial) |
| DELETE | `/api/students/:id` | Delete student |
| GET | `/api/students/class/:classId` | Get students by class |
| GET | `/api/students/search` | Search students |
| GET | `/api/students/statistics` | Get statistics |
| GET | `/api/students/summary` | Get summary for dashboard |
| GET | `/api/students/check-admission/:admissionNumber` | Check admission number |

### Dependencies
- Milestone 0 (Foundation)

### Completion Checklist
- [ ] All API endpoints return correct responses
- [ ] All API endpoints handle errors properly
- [ ] Frontend pages render correctly on mobile
- [ ] Frontend pages render correctly on desktop
- [ ] All forms validate input
- [ ] Search and filtering work correctly
- [ ] Pagination works correctly
- [ ] Tests pass
- [ ] Mobile responsiveness verified

---

## Milestone 2: Class Management

**Status**: ⏳ NOT STARTED  
**Objective**: Manage school classes/grades

### Backend
- [ ] Class Model
- [ ] Class Service
- [ ] Class Controller
- [ ] Class Routes
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Class List Page
- [ ] Class Create/Edit Pages
- [ ] Class Detail Page
- [ ] Class Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/classes` | List classes |
| GET | `/api/classes/:id` | Get class by ID |
| POST | `/api/classes` | Create class |
| PUT | `/api/classes/:id` | Update class |
| DELETE | `/api/classes/:id` | Delete class |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management - for class assignment)

---

## Milestone 3: School Fees Management

**Status**: ⏳ NOT STARTED  
**Objective**: Track school fee payments with individual ledgers

### Backend
- [ ] School Fee Model
- [ ] School Fee Service
- [ ] School Fee Controller
- [ ] School Fee Routes
- [ ] Balance calculation logic
- [ ] Partial payment support
- [ ] Full payment support
- [ ] Arrears tracking
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] School Fee List Page
- [ ] School Fee Payment Page
- [ ] Student Fee Statement Page
- [ ] Fee Arrears Report
- [ ] Fee Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/fees` | List fee payments |
| GET | `/api/fees/student/:studentId` | Get student's fee history |
| POST | `/api/fees` | Record fee payment |
| GET | `/api/fees/balance/:studentId` | Get student's current balance |
| GET | `/api/fees/arrears` | Get all students in arrears |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management)

---

## Milestone 4: Lunch Management

**Status**: ⏳ NOT STARTED  
**Objective**: Track lunch payments and attendance

### Backend
- [ ] Lunch Payment Model
- [ ] Lunch Attendance Model
- [ ] Lunch Service
- [ ] Lunch Controller
- [ ] Lunch Routes
- [ ] Daily payment support
- [ ] Weekly payment support
- [ ] Monthly payment support
- [ ] Attendance tracking
- [ ] Arrears calculation
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Lunch Payment Page
- [ ] Lunch Attendance Page
- [ ] Lunch Arrears Report
- [ ] Lunch Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/lunch/payments` | List lunch payments |
| POST | `/api/lunch/payments` | Record lunch payment |
| GET | `/api/lunch/attendance` | Get lunch attendance |
| POST | `/api/lunch/attendance` | Record attendance |
| GET | `/api/lunch/arrears` | Get lunch arrears |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management)

---

## Milestone 5: Student Charges Management

**Status**: ⏳ NOT STARTED  
**Objective**: Manage custom charges (swimming, trips, sports, etc.)

### Backend
- [ ] Student Charge Model
- [ ] Student Charge Assignment Model
- [ ] Student Charge Service
- [ ] Student Charge Controller
- [ ] Student Charge Routes
- [ ] Individual charge support
- [ ] Class-wide charge support
- [ ] Grade-wide charge support
- [ ] Custom group charge support
- [ ] Payment tracking
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Charge List Page
- [ ] Charge Create/Edit Pages
- [ ] Charge Assignment Page
- [ ] Charge Payment Page
- [ ] Charge Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/charges` | List charges |
| POST | `/api/charges` | Create charge |
| GET | `/api/charges/:id` | Get charge by ID |
| PUT | `/api/charges/:id` | Update charge |
| DELETE | `/api/charges/:id` | Delete charge |
| GET | `/api/charges/assignments` | List charge assignments |
| POST | `/api/charges/assign` | Assign charge to students |
| GET | `/api/charges/student/:studentId` | Get student's charges |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management)

---

## Milestone 6: Income Management

**Status**: ⏳ NOT STARTED  
**Objective**: Track all income sources

### Backend
- [ ] Income Model
- [ ] Income Service
- [ ] Income Controller
- [ ] Income Routes
- [ ] Receipt generation integration
- [ ] Category-based tracking
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Income List Page
- [ ] Income Create/Edit Pages
- [ ] Income Detail Page
- [ ] Income Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/income` | List income records |
| POST | `/api/income` | Record income |
| GET | `/api/income/:id` | Get income by ID |
| PUT | `/api/income/:id` | Update income |
| DELETE | `/api/income/:id` | Delete income |
| GET | `/api/income/category/:categoryId` | Get by category |
| GET | `/api/income/statistics` | Get income statistics |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management - optional, for student-related income)

---

## Milestone 7: Expense Management

**Status**: ⏳ NOT STARTED  
**Objective**: Track all expenses with hierarchical categories

### Backend
- [ ] Expense Model
- [ ] Expense Service
- [ ] Expense Controller
- [ ] Expense Routes
- [ ] Hierarchical category support
- [ ] Kitchen category customization
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Expense List Page
- [ ] Expense Create/Edit Pages
- [ ] Expense Detail Page
- [ ] Expense Category Management
- [ ] Expense Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/expenses` | List expenses |
| POST | `/api/expenses` | Record expense |
| GET | `/api/expenses/:id` | Get expense by ID |
| PUT | `/api/expenses/:id` | Update expense |
| DELETE | `/api/expenses/:id` | Delete expense |
| GET | `/api/expenses/category/:categoryId` | Get by category |
| GET | `/api/expenses/statistics` | Get expense statistics |
| GET | `/api/expenses/categories` | List expense categories |
| POST | `/api/expenses/categories` | Create category |

### Dependencies
- Milestone 0 (Foundation)

---

## Milestone 8: Director Withdrawals

**Status**: ⏳ NOT STARTED  
**Objective**: Track director/management withdrawals

### Backend
- [ ] Director Withdrawal Model
- [ ] Director Withdrawal Service
- [ ] Director Withdrawal Controller
- [ ] Director Withdrawal Routes
- [ ] Approval workflow
- [ ] Configurable labels
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Withdrawal List Page
- [ ] Withdrawal Create Page
- [ ] Withdrawal Detail Page
- [ ] Withdrawal Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/withdrawals` | List withdrawals |
| POST | `/api/withdrawals` | Record withdrawal |
| GET | `/api/withdrawals/:id` | Get withdrawal by ID |
| PUT | `/api/withdrawals/:id` | Update withdrawal |
| DELETE | `/api/withdrawals/:id` | Delete withdrawal |
| POST | `/api/withdrawals/:id/approve` | Approve withdrawal |

### Dependencies
- Milestone 0 (Foundation)

---

## Milestone 9: Daily Ledger

**Status**: ⏳ NOT STARTED  
**Objective**: Complete daily financial tracking

### Backend
- [ ] Daily Ledger Model
- [ ] Daily Ledger Service
- [ ] Daily Ledger Controller
- [ ] Daily Ledger Routes
- [ ] Automatic calculation from transactions
- [ ] Manual entry support
- [ ] Opening/closing balance tracking
- [ ] Update index files
- [ ] Mount routes in app.js
- [ ] Write tests

### Frontend
- [ ] Daily Ledger Page
- [ ] Ledger Entry Page
- [ ] Ledger Detail Page
- [ ] Ledger Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/ledger` | List daily ledger entries |
| GET | `/api/ledger/:date` | Get ledger for specific date |
| POST | `/api/ledger` | Create manual ledger entry |
| PUT | `/api/ledger/:date` | Update ledger entry |
| GET | `/api/ledger/summary` | Get ledger summary |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 6 (Income Management)
- Milestone 7 (Expense Management)

---

## Milestone 10: Transactions

**Status**: ⏳ NOT STARTED  
**Objective**: Unified transaction management

### Backend
- [ ] Transaction Model (enhanced)
- [ ] Transaction Service (enhanced)
- [ ] Transaction Controller (enhanced)
- [ ] Transaction Routes (enhanced)
- [ ] Advanced filtering
- [ ] Search functionality
- [ ] Update index files
- [ ] Write tests

### Frontend
- [ ] Transaction List Page
- [ ] Transaction Detail Page
- [ ] Transaction Filtering
- [ ] Transaction Components
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List transactions |
| GET | `/api/transactions/:id` | Get transaction by ID |
| GET | `/api/transactions/search` | Search transactions |
| GET | `/api/transactions/filter` | Filter transactions |

### Dependencies
- Milestone 0 (Foundation)
- All previous milestones (for transaction types)

---

## Milestone 11: Reports

**Status**: ⏳ NOT STARTED  
**Objective**: Comprehensive reporting system

### Backend
- [ ] Report Service
- [ ] Report Controller
- [ ] Report Routes
- [ ] Daily Report
- [ ] Weekly Report
- [ ] Monthly Report
- [ ] Annual Report
- [ ] Custom Date Range Report
- [ ] Filter by student, grade, category, payment method
- [ ] Export to CSV/Excel
- [ ] Cached reports for performance
- [ ] Write tests

### Frontend
- [ ] Report Dashboard
- [ ] Report List Page
- [ ] Report Viewer
- [ ] Report Filter Controls
- [ ] Report Export Controls
- [ ] Report Components
- [ ] Update routing
- [ ] Update navigation

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/reports/daily` | Daily report |
| GET | `/api/reports/weekly` | Weekly report |
| GET | `/api/reports/monthly` | Monthly report |
| GET | `/api/reports/annual` | Annual report |
| GET | `/api/reports/custom` | Custom date range report |
| GET | `/api/reports/export` | Export report |

### Dependencies
- Milestone 0 (Foundation)
- All previous milestones (for data)

---

## Milestone 12: Audit Trail

**Status**: ⏳ NOT STARTED  
**Objective**: Complete change history tracking

### Backend
- [ ] Audit Trail Service (enhanced)
- [ ] Audit Trail Controller
- [ ] Audit Trail Routes
- [ ] Automatic logging for all changes
- [ ] Detailed change information
- [ ] User tracking
- [ ] Write tests

### Frontend
- [ ] Audit Trail Page
- [ ] Audit Detail Page
- [ ] Audit Filtering
- [ ] Audit Components
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/audit` | List audit entries |
| GET | `/api/audit/:id` | Get audit entry by ID |
| GET | `/api/audit/filter` | Filter audit entries |

### Dependencies
- Milestone 0 (Foundation)
- All previous milestones (for auditable actions)

---

## Milestone 13: Receipts

**Status**: ⏳ NOT STARTED  
**Objective**: Receipt generation and management

### Backend
- [ ] Receipt Service (enhanced)
- [ ] Receipt Controller
- [ ] Receipt Routes
- [ ] Receipt printing
- [ ] Receipt search
- [ ] Receipt validation
- [ ] Write tests

### Frontend
- [ ] Receipt List Page
- [ ] Receipt View/Print Page
- [ ] Receipt Search
- [ ] Receipt Components
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/receipts` | List receipts |
| GET | `/api/receipts/:number` | Get receipt by number |
| GET | `/api/receipts/search` | Search receipts |
| GET | `/api/receipts/print/:number` | Get printable receipt |

### Dependencies
- Milestone 0 (Foundation - receipt generator exists)
- Milestone 6 (Income Management)
- Milestone 3 (School Fees)
- Milestone 4 (Lunch)

---

## Milestone 14: Search & Filtering

**Status**: ⏳ NOT STARTED  
**Objective**: Global search and advanced filtering

### Backend
- [ ] Global Search Service
- [ ] Global Search Controller
- [ ] Global Search Routes
- [ ] Full-text search
- [ ] Multi-criteria filtering
- [ ] Write tests

### Frontend
- [ ] Global Search Component
- [ ] Search Results Page
- [ ] Advanced Filter Controls
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/search` | Global search |
| GET | `/api/search/advanced` | Advanced search |

### Dependencies
- Milestone 0 (Foundation)
- All previous milestones (for searchable data)

---

## Milestone 15: Dashboard

**Status**: ⏳ NOT STARTED  
**Objective**: Main dashboard with financial overview

### Backend
- [ ] Dashboard Service
- [ ] Dashboard Controller
- [ ] Dashboard Routes
- [ ] Summary calculations
- [ ] Write tests

### Frontend
- [ ] Dashboard Page
- [ ] Summary Cards
- [ ] Charts and Graphs
- [ ] Quick Actions
- [ ] Recent Activity
- [ ] Dashboard Components
- [ ] Update routing (set as home page)

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard` | Get dashboard data |
| GET | `/api/dashboard/summary` | Get summary cards |
| GET | `/api/dashboard/charts` | Get chart data |

### Dependencies
- Milestone 0 (Foundation)
- Milestone 1 (Student Management - for student count)
- Milestone 6 (Income Management)
- Milestone 7 (Expense Management)
- Milestone 3 (School Fees)
- Milestone 4 (Lunch)

---

## Milestone 16: Authentication & Authorization

**Status**: ⏳ NOT STARTED  
**Objective**: User authentication and role-based access control

### Backend
- [ ] Authentication Service
- [ ] Authentication Controller
- [ ] Authentication Routes
- [ ] User Model (enhanced)
- [ ] Session management
- [ ] JWT token handling
- [ ] Password hashing
- [ ] Role-based middleware
- [ ] Protected routes
- [ ] Write tests

### Frontend
- [ ] Login Page
- [ ] Registration Page (if needed)
- [ ] User Profile Page
- [ ] Authentication Components
- [ ] Protected Route Component
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/logout` | Logout |
| POST | `/api/auth/refresh` | Refresh token |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/users` | List users (admin only) |
| POST | `/api/users` | Create user (admin only) |

### Dependencies
- Milestone 0 (Foundation)

---

## Milestone 17: Data Import/Export

**Status**: ⏳ NOT STARTED  
**Objective**: Backup, restore, import, and export functionality

### Backend
- [ ] Import/Export Service
- [ ] Import/Export Controller
- [ ] Import/Export Routes
- [ ] Database backup
- [ ] Database restore
- [ ] CSV import
- [ ] CSV export
- [ ] Excel import/export (if feasible in Termux)
- [ ] Write tests

### Frontend
- [ ] Import/Export Page
- [ ] Backup Controls
- [ ] Restore Controls
- [ ] Import Controls
- [ ] Export Controls
- [ ] Import/Export Components
- [ ] Update routing

### API Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/export/database` | Export database |
| POST | `/api/import/database` | Import database |
| GET | `/api/export/csv` | Export to CSV |
| POST | `/api/import/csv` | Import from CSV |
| GET | `/api/backup` | Create backup |
| POST | `/api/restore` | Restore backup |

### Dependencies
- Milestone 0 (Foundation)

---

## Milestone 18: Final Polish

**Status**: ⏳ NOT STARTED  
**Objective**: Production readiness

### Tasks
- [ ] Mobile responsiveness verification (all pages)
- [ ] Performance optimization
- [ ] Code review and refactoring
- [ ] Final testing (all features)
- [ ] Documentation completion
- [ ] README.md updates
- [ ] Deployment preparation
- [ ] Termux compatibility verification

### Dependencies
- All previous milestones

---

## Project Completion Checklist

- [ ] Milestone 0: Foundation Architecture ✅
- [ ] Milestone 1: Student Management 🚧
- [ ] Milestone 2: Class Management
- [ ] Milestone 3: School Fees Management
- [ ] Milestone 4: Lunch Management
- [ ] Milestone 5: Student Charges Management
- [ ] Milestone 6: Income Management
- [ ] Milestone 7: Expense Management
- [ ] Milestone 8: Director Withdrawals
- [ ] Milestone 9: Daily Ledger
- [ ] Milestone 10: Transactions
- [ ] Milestone 11: Reports
- [ ] Milestone 12: Audit Trail
- [ ] Milestone 13: Receipts
- [ ] Milestone 14: Search & Filtering
- [ ] Milestone 15: Dashboard
- [ ] Milestone 16: Authentication & Authorization
- [ ] Milestone 17: Data Import/Export
- [ ] Milestone 18: Final Polish

---

## Estimated Timeline

| Milestone | Estimated Duration | Status |
|-----------|-------------------|--------|
| Milestone 0 | 1 session | ✅ Complete |
| Milestone 1 | 2-3 sessions | 🚧 In Progress |
| Milestone 2 | 1 session | ⏳ Not Started |
| Milestone 3 | 2 sessions | ⏳ Not Started |
| Milestone 4 | 2 sessions | ⏳ Not Started |
| Milestone 5 | 2 sessions | ⏳ Not Started |
| Milestone 6 | 2 sessions | ⏳ Not Started |
| Milestone 7 | 2 sessions | ⏳ Not Started |
| Milestone 8 | 1 session | ⏳ Not Started |
| Milestone 9 | 1 session | ⏳ Not Started |
| Milestone 10 | 1 session | ⏳ Not Started |
| Milestone 11 | 2 sessions | ⏳ Not Started |
| Milestone 12 | 1 session | ⏳ Not Started |
| Milestone 13 | 1 session | ⏳ Not Started |
| Milestone 14 | 1 session | ⏳ Not Started |
| Milestone 15 | 2 sessions | ⏳ Not Started |
| Milestone 16 | 2 sessions | ⏳ Not Started |
| Milestone 17 | 1 session | ⏳ Not Started |
| Milestone 18 | 1 session | ⏳ Not Started |

**Total Estimated Sessions**: ~25-30

---

## Notes

1. **Session Length**: Each session is approximately 20-30 minutes of productive work
2. **Checkpoint Policy**: Commit and push after each logical unit of work (every 20-30 minutes)
3. **Mobile-First**: Every feature must be verified on mobile before completion
4. **Financial Integrity**: Never compromise accuracy for convenience
5. **Clean Architecture**: Maintain separation of concerns and existing patterns

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-22 | Initial roadmap created |
