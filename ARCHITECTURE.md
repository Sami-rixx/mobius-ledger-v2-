# Mobius Ledger v2 - Architecture Documentation

## Project Philosophy

**Mobius Ledger v2** is built under the **Möbius Muse** philosophy: *"Making Ideas Inevitable."*

Every feature feels intentional, clean, and effortless to use. The system prioritizes:

1. **Correctness** - Financial integrity above all else
2. **Reliability** - The system must work consistently
3. **Maintainability** - Code must be readable and modifiable
4. **Production Quality** - Built for real-world daily use
5. **Mobile-First** - Every feature must work on mobile browsers

---

## Technology Stack

### Backend
- **Runtime**: Node.js (v22+ recommended)
- **Framework**: Express.js
- **Database**: SQLite (with better-sqlite3)
  - Future migration path to PostgreSQL
- **Security**: Helmet, CORS, Rate Limiting
- **Testing**: Jest

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Routing**: React Router
- **Styling**: SCSS (Custom Design System)
- **State Management**: React hooks (useState, useEffect, custom hooks)

### Development Environment
- **Primary**: Termux on Android
- **Secondary**: Any Node.js/React development environment
- **Target**: Mobile browsers (Chrome, Firefox on Android)

---

## Folder Structure

```
mobius-ledger-v2/
├── backend/                          # Node.js/Express API
│   ├── src/
│   │   ├── config/                   # Database, constants, configuration
│   │   │   ├── database.js           # Database connection and setup
│   │   │   └── ...
│   │   ├── controllers/              # Route handlers (thin layer)
│   │   │   ├── studentController.js
│   │   │   ├── classController.js
│   │   │   ├── schoolFeeController.js
│   │   │   └── index.js
│   │   ├── middleware/                # Express middleware
│   │   │   ├── errorHandler.js
│   │   │   └── ...
│   │   ├── models/                   # Database models (data access layer)
│   │   │   ├── Student.js
│   │   │   ├── Class.js
│   │   │   ├── SchoolFee.js
│   │   │   ├── Transaction.js
│   │   │   └── index.js
│   │   ├── routes/                   # API endpoint definitions
│   │   │   ├── healthRoutes.js
│   │   │   ├── studentRoutes.js
│   │   │   ├── classRoutes.js
│   │   │   ├── schoolFeeRoutes.js
│   │   │   └── index.js
│   │   ├── services/                 # Business logic layer
│   │   │   ├── studentService.js
│   │   │   ├── classService.js
│   │   │   ├── schoolFeeService.js
│   │   │   └── index.js
│   │   ├── utils/                    # Helper functions and utilities
│   │   │   ├── receiptGenerator.js
│   │   │   └── ...
│   │   ├── __tests__/                # Test files
│   │   │   └── ...
│   │   └── app.js                    # Express application setup
│   └── package.json
│
├── frontend/                         # React + Vite application
│   ├── src/
│   │   ├── components/              # Reusable UI components
│   │   │   ├── Button.jsx
│   │   │   ├── Card.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Table.jsx
│   │   │   ├── StudentForm.jsx
│   │   │   ├── StudentCard.jsx
│   │   │   ├── StudentTable.jsx
│   │   │   ├── ClassForm.jsx
│   │   │   ├── ClassCard.jsx
│   │   │   ├── ClassTable.jsx
│   │   │   └── index.js
│   │   ├── pages/                    # Page components
│   │   │   ├── HomePage.jsx
│   │   │   ├── Students/
│   │   │   │   ├── StudentListPage.jsx
│   │   │   │   ├── StudentCreatePage.jsx
│   │   │   │   ├── StudentEditPage.jsx
│   │   │   │   ├── StudentDetailPage.jsx
│   │   │   │   └── index.js
│   │   │   ├── Classes/
│   │   │   │   ├── ClassListPage.jsx
│   │   │   │   ├── ClassCreatePage.jsx
│   │   │   │   ├── ClassEditPage.jsx
│   │   │   │   ├── ClassDetailPage.jsx
│   │   │   │   └── index.js
│   │   │   └── ...
│   │   ├── services/                 # API client services
│   │   │   ├── api.js               # Base API client
│   │   │   ├── studentService.js
│   │   │   ├── classService.js
│   │   │   └── index.js
│   │   ├── styles/                   # SCSS styles
│   │   │   └── index.scss
│   │   └── App.jsx                   # Main application with routing
│   └── package.json
│
├── database/                         # Database files
│   ├── mobius_ledger.db             # SQLite database (gitignored)
│   ├── schema.sql                   # Database schema definition
│   └── setup.js                     # Database setup script
│
├── docs/                            # Documentation (optional)
│
└── root files
    ├── README.md
    ├── ARCHITECTURE.md
    ├── CURRENT_MILESTONE.md
    ├── MODULE_STATUS.md
    ├── PROJECT_STATUS.md
    ├── SESSION_HANDOFF.md
    ├── DEVELOPMENT_ROADMAP.md
    └── .gitignore
```

---

## Layer Responsibilities

### Backend Architecture (Clean Architecture)

```
┌─────────────────────────────────────────────────────────────┐
│                        HTTP Layer                              │
│                    (Routes + Controllers)                      │
│  - Receive HTTP requests                                       │
│  - Validate request data                                        │
│  - Call appropriate service methods                            │
│  - Format HTTP responses                                        │
│  - Handle HTTP errors                                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                              │
│                    (Business Logic)                             │
│  - Contain business rules                                       │
│  - Orchestrate multiple model operations                       │
│  - Handle transactions (atomic operations)                    │
│  - Generate receipts                                            │
│  - Calculate balances                                           │
│  - Transform data for API responses                             │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Model Layer                               │
│                    (Data Access Layer)                          │
│  - Direct database operations                                  │
│  - CRUD operations                                              │
│  - Simple queries                                               │
│  - NO business logic                                            │
│  - NO validation (except data type safety)                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Database Layer                            │
│                    (SQLite / PostgreSQL)                         │
│  - Schema definition                                            │
│  - Triggers                                                     │
│  - Views                                                        │
│  - Indexes                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Page Layer                               │
│                    (Page Components)                           │
│  - Route-specific components                                    │
│  - Thin layer (delegates to services/components)               │
│  - Minimal business logic                                       │
│  - Uses hooks for data fetching                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Component Layer                            │
│                    (Reusable UI Components)                     │
│  - Shared UI elements                                           │
│  - Form components                                              │
│  - Display components                                           │
│  - NO direct API calls                                          │
│  - Receive props and render                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                       Service Layer                              │
│                    (API Client Services)                        │
│  - HTTP requests to backend API                                 │
│  - Error handling                                              │
│  - Data transformation                                          │
│  - NO business logic                                            │
│  - NO state management                                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Clean Architecture Rules

### 1. Separation of Concerns
- **Controllers** should only handle HTTP concerns (request/response)
- **Services** should contain all business logic
- **Models** should only perform database operations
- **Components** should only render UI
- **Pages** should only compose components and call services

### 2. Dependency Direction
- Controllers → Services → Models → Database
- Pages → Services → Components
- **Never** reverse these dependencies

### 3. Business Logic Location
- ✅ **DO**: Put business logic in Services
- ❌ **DON'T**: Put business logic in Controllers
- ❌ **DON'T**: Put business logic in Models
- ❌ **DON'T**: Put business logic in UI Components
- ❌ **DON'T**: Put business logic in Pages

### 4. Data Flow
- Frontend → API → Controller → Service → Model → Database
- Database → Model → Service → Controller → API → Frontend

### 5. Reusability
- Services should be reusable across multiple controllers
- Components should be reusable across multiple pages
- Models should be reusable across multiple services

---

## Naming Conventions

### Files
- **Models**: PascalCase (e.g., `Student.js`, `SchoolFee.js`)
- **Services**: camelCase (e.g., `studentService.js`, `schoolFeeService.js`)
- **Controllers**: PascalCase (e.g., `studentController.js`, `schoolFeeController.js`)
- **Routes**: PascalCase (e.g., `studentRoutes.js`, `schoolFeeRoutes.js`)
- **Components**: PascalCase (e.g., `StudentForm.jsx`, `ClassCard.jsx`)
- **Pages**: PascalCase (e.g., `StudentListPage.jsx`, `ClassDetailPage.jsx`)
- **Utils**: camelCase (e.g., `receiptGenerator.js`, `dateFormatter.js`)

### Functions/Methods
- **Models**: `getAllStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`
- **Services**: `getPaginatedStudents`, `getStudentWithBalance`, `createStudentWithValidation`
- **Controllers**: `getStudents`, `getStudentById`, `createStudent`, `updateStudent`, `deleteStudent`
- **Components**: PascalCase (e.g., `StudentForm`, `ClassCard`)

### Variables
- Use descriptive names
- Use camelCase
- Avoid abbreviations unless widely understood

### Constants
- Use UPPER_SNAKE_CASE
- Group related constants together

---

## Coding Standards

### General
- Use ESM modules (`import`/`export`)
- Use strict equality (`===`, `!==`)
- Avoid `var` (use `const` or `let`)
- Prefer `const` over `let` when possible
- Use template literals for strings
- Use arrow functions for callbacks

### Error Handling
- Always handle errors in controllers
- Return consistent error formats
- Use HTTP status codes appropriately
- Log errors for debugging
- Never expose sensitive error details to clients

### Database
- Use parameterized queries (prevent SQL injection)
- Use transactions for atomic operations
- Enable foreign keys
- Use WAL mode for SQLite
- Create indexes for performance-critical queries

### Financial Calculations
- **NEVER** perform financial calculations in UI components
- **ALWAYS** perform financial calculations in Services
- Use Decimal(10,2) for monetary values in database
- Use parseFloat() for JavaScript number conversion
- Always validate monetary input

### API Design
- Use RESTful conventions
- Use plural nouns for endpoints (e.g., `/api/students`, `/api/classes`)
- Use HTTP methods correctly:
  - GET: Retrieve data
  - POST: Create data
  - PUT: Replace data
  - PATCH: Update data partially
  - DELETE: Remove data
- Use query parameters for filtering/sorting
- Use request body for creation/updates
- Return consistent response formats

### Response Formats
```json
// Success response
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}

// Error response
{
  "success": false,
  "error": "Error message"
}

// Paginated response
{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

---

## Git Workflow

### Branching
- **Main Branch**: `main` - Always stable, production-ready
- **Feature Branches**: `vibe/<feature>-<timestamp>` - For AI sessions
- **Release Branches**: Future consideration

### Commit Messages
- Use imperative mood (e.g., "Add feature", not "Added feature")
- Use lowercase for first word
- Include module/milestone context
- Include phase number if applicable
- Example: `feat: add School Fees Management backend (Milestone 3 - Phases 1-4)`

### Commit Frequency
- Commit after every completed phase
- Commit after every logical unit of work
- **NEVER** leave completed work only in local sandbox
- Push immediately after every commit

### Pull Requests
- Use draft PRs for work in progress
- Include descriptive title and body
- Reference related issues if applicable
- Include verification steps

---

## Documentation Workflow

### Required Documentation Files
Every developer/AI session must read these files before writing code:

1. **README.md** - Project overview, setup, running
2. **ARCHITECTURE.md** - Architecture, patterns, conventions
3. **CURRENT_MILESTONE.md** - Current development priority
4. **MODULE_STATUS.md** - Status of all modules
5. **PROJECT_STATUS.md** - High-level project status
6. **SESSION_HANDOFF.md** - Previous session details
7. **DEVELOPMENT_ROADMAP.md** - Complete project roadmap

### Documentation Update Rules
- Update documentation **after** every completed phase
- Update documentation **before** starting new work
- Keep documentation **internally consistent**
- Verify all cross-references between documents

### Documentation Standards
- Use Markdown format
- Use consistent heading hierarchy
- Use tables for structured data
- Include status indicators (✅, 🚧, ⏳, ❌)
- Include dates and commit hashes where relevant

---

## Testing Strategy

### Backend Testing
- Use Jest for unit and integration tests
- Test Models: CRUD operations, queries
- Test Services: Business logic, calculations
- Test Controllers: Request handling, validation, responses
- Test Routes: Endpoint integration

### Frontend Testing
- Verify production build succeeds
- Verify routing works correctly
- Verify responsive layouts (mobile-first)
- Verify API integration
- Manual testing for UI/UX

### Test Coverage
- Aim for 80%+ coverage for critical modules
- Always test financial calculations
- Always test data validation
- Test edge cases and error conditions

### Running Tests
```bash
# Backend tests
cd backend
npm test

# Frontend build
cd frontend
npm run build
```

---

## Financial Integrity Principles

### Core Rules
1. **Receipt Numbers Must Be Unique** - Use receipt generator utility
2. **No Duplicate Transactions** - Prevent duplicate receipt numbers
3. **No Orphan Records** - Maintain referential integrity
4. **Atomic Operations** - Use database transactions for related operations
5. **Balance Consistency** - Balances must always be calculable from transactions
6. **Never Silently Discard Data** - Always log or report financial data issues
7. **Validate All Monetary Input** - Client and server-side validation
8. **Store Monetary Values Consistently** - Always as DECIMAL(10,2) in database

### Implementation Guidelines
- Financial calculations belong in **Services**
- Financial validation belongs in **Services** and **Controllers**
- Financial data storage belongs in **Models**
- Financial display belongs in **Components**
- Never perform calculations in UI components

### Receipt Generation
- Use `generateReceiptNumber()` from `backend/src/utils/receiptGenerator.js`
- Format: `ML-YYYY-######` (e.g., `ML-2026-000001`)
- Year resets sequence to 0
- Sequence increments atomically

---

## Mobile-First Design Requirements

### Core Principles
1. **Mobile is Primary** - Every feature must work on mobile first
2. **Responsive Layouts** - Adapt to all screen sizes
3. **Touch-Friendly** - Minimum 44x44px touch targets
4. **No Horizontal Overflow** - Content must fit within viewport
5. **Performance** - Optimize for low-end devices and slow networks
6. **Accessibility** - Ensure good contrast and readable text

### Design System
- **Theme Colors**: Brown, Black, White
- **Typography**: System fonts for performance
- **Spacing**: Consistent spacing scale
- **Components**: Reusable, accessible, mobile-optimized

### Testing Requirements
- Test on Chrome Mobile (Android)
- Test on Firefox Mobile (Android)
- Verify no horizontal scrolling
- Verify touch targets are adequate
- Verify form inputs work on mobile keyboards
- Verify tables are responsive

---

## Module Implementation Template

Every new module should follow this implementation pattern:

### Backend (Phases 1-4)

#### Phase 1: Model
1. Create `backend/src/models/<Module>.js`
2. Implement CRUD operations
3. Add search/filter methods
4. Add count methods for pagination
5. Export from `backend/src/models/index.js`

#### Phase 2: Service
1. Create `backend/src/services/<module>Service.js`
2. Implement business logic
3. Add pagination support
4. Add data transformation
5. Export from `backend/src/services/index.js`

#### Phase 3: Controller
1. Create `backend/src/controllers/<module>Controller.js`
2. Implement endpoint handlers
3. Add request validation
4. Add error handling
5. Export from `backend/src/controllers/index.js`

#### Phase 4: Routes
1. Create `backend/src/routes/<module>Routes.js`
2. Define RESTful endpoints
3. Export from `backend/src/routes/index.js`
4. Mount in `backend/src/app.js`

### Frontend (Phases 5-8)

#### Phase 5: Service
1. Create `frontend/src/services/<module>Service.js`
2. Implement API client methods
3. Add error handling
4. Export from `frontend/src/services/index.js`

#### Phase 6: Components
1. Create reusable components in `frontend/src/components/`
2. Follow existing patterns (Form, Card, Table)
3. Export from `frontend/src/components/index.js`

#### Phase 7: Pages
1. Create page components in `frontend/src/pages/<Module>/`
2. Implement List, Create, Edit, Detail pages
3. Create barrel export `index.js`
4. Use existing components and services

#### Phase 8: Routing & Navigation
1. Import pages in `frontend/src/App.jsx`
2. Add routes to `<Routes>`
3. Add navigation links
4. Update HomePage with quick access buttons
5. Verify routing works

### Verification (After Every Phase)
1. Syntax check: `node --check <file>`
2. Backend tests: `npm test`
3. Frontend build: `npm run build`
4. Manual testing of new endpoints
5. Update documentation
6. Commit and push

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

### Detailed Steps

1. **Inspect**
   - Pull latest changes from GitHub
   - Read all documentation files
   - Inspect current repository state
   - Understand what was completed
   - Identify what needs to be done

2. **Plan**
   - Review CURRENT_MILESTONE.md for next task
   - Review MODULE_STATUS.md for context
   - Identify files to create/modify
   - Plan implementation approach

3. **Implement**
   - Follow Clean Architecture rules
   - Follow naming conventions
   - Follow coding standards
   - Keep changes focused and minimal

4. **Verify**
   - Syntax validation
   - Import checks
   - Manual inspection
   - Test new functionality

5. **Test**
   - Run backend tests
   - Run frontend build
   - Manual testing on mobile
   - Verify existing functionality still works

6. **Update Documentation**
   - Update CURRENT_MILESTONE.md
   - Update MODULE_STATUS.md
   - Update PROJECT_STATUS.md
   - Update SESSION_HANDOFF.md
   - Update any other relevant docs

7. **Commit**
   - Stage all changes
   - Write descriptive commit message
   - Include milestone/phase context

8. **Push**
   - Push to GitHub immediately
   - Verify push succeeded
   - Never leave work only in sandbox

### Never Skip
- ❌ Never skip verification
- ❌ Never skip testing
- ❌ Never skip documentation
- ❌ Never skip commit
- ❌ Never skip push

---

## Repository Governance

### Single Source of Truth
- **GitHub** is the permanent source of truth
- The repository state on GitHub is canonical
- Local sandbox work is temporary

### Documentation Principles
- Documentation must always match the repository state
- Documentation must be internally consistent
- Cross-references between documents must be correct
- Update documentation after every completed phase

### Work Completion
Every completed feature requires:
1. ✅ Implementation
2. ✅ Verification
3. ✅ Testing
4. ✅ Documentation
5. ✅ Commit
6. ✅ Push to GitHub

### Future Session Requirements
Every new AI session or developer must:
1. Pull latest changes from GitHub
2. Read all documentation files
3. Inspect repository structure
4. Understand current state from CURRENT_MILESTONE.md
5. Continue from the documented next task
6. Follow the standard workflow

---

## Quick Start for New Sessions

```bash
# 1. Clone or update repository
git pull origin main

# 2. Read documentation
cat README.md
cat ARCHITECTURE.md
cat CURRENT_MILESTONE.md
cat MODULE_STATUS.md
cat PROJECT_STATUS.md
cat SESSION_HANDOFF.md
cat DEVELOPMENT_ROADMAP.md

# 3. Check current state
git status
git log --oneline -5

# 4. Identify next task from CURRENT_MILESTONE.md

# 5. Implement following the workflow
```

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-07-23 | Initial architecture documentation created |

---

*This file must be kept up-to-date as the project evolves.*
