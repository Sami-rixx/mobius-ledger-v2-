import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { authenticate, csrfProtection } from './middleware/auth.js';
import { setupDatabase } from './config/database.js';
import authRoutes from './routes/authRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import classRoutes from './routes/classRoutes.js';
import schoolFeeRoutes from './routes/schoolFeeRoutes.js';
import studentChargeRoutes from './routes/studentChargeRoutes.js';
import studentChargeAssignmentRoutes from './routes/studentChargeAssignmentRoutes.js';
import incomeRoutes from './routes/incomeRoutes.js';
import incomeCategoryRoutes from './routes/incomeCategoryRoutes.js';
import expenseRoutes from './routes/expenseRoutes.js';
import expenseCategoryRoutes from './routes/expenseCategoryRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import dailySummaryRoutes from './routes/dailySummaryRoutes.js';
import directorWithdrawalRoutes from './routes/directorWithdrawalRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import auditTrailRoutes from './routes/auditTrailRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import userSessionRoutes from './routes/userSessionRoutes.js';
import userRoutes from './routes/userRoutes.js';
import permissionRoutes from './routes/permissionRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import userRoleRoutes from './routes/userRoleRoutes.js';
import rolePermissionRoutes from './routes/rolePermissionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dailyLedgerRoutes from './routes/dailyLedgerRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Production deployments run behind a reverse proxy (nginx) on a single
// VPS/VM; trust exactly one proxy hop so req.ip and secure cookies work.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting (disabled under test so security suites can exercise the
// full authorization matrix; production/dev behavior is unchanged).
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Request logging (quiet under test)
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Performance middleware
// Enable gzip compression for all responses
app.use(compression({
  threshold: 0,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// Database setup
setupDatabase();

// ============================================================
// SECURITY PERIMETER (specification §4/§5/§10)
// Public endpoints: health/readiness and POST /api/auth/login only.
// Everything else under /api requires an authenticated session and
// the CSRF custom-header on state-changing requests.
// ============================================================

// CSRF custom-header check for every state-changing /api request
// (including login, which the frontend always sends the header for).
app.use('/api', csrfProtection);

// Public: health/readiness + authentication entrypoints
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

// Global authentication boundary: every route mounted below this line
// requires a valid session (fail closed).
app.use('/api', authenticate);
app.use('/api/students', studentRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/school-fees', schoolFeeRoutes);
app.use('/api/charges', studentChargeRoutes);
app.use('/api/charges/assignments', studentChargeAssignmentRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/income-categories', incomeCategoryRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/expense-categories', expenseCategoryRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/daily-summaries', dailySummaryRoutes);
app.use('/api/withdrawals', directorWithdrawalRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/audit-trail', auditTrailRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/user-sessions', userSessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/permissions', permissionRoutes);
app.use('/api/roles', roleRoutes);
app.use('/api/user-roles', userRoleRoutes);
app.use('/api/role-permissions', rolePermissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/daily-ledger', dailyLedgerRoutes);
app.use('/api/import-export', importExportRoutes);
// Future routes will be mounted here:
// app.use('/api/lunch', lunchRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Mobius Ledger v2 API',
    version: '1.0.0',
    docs: '/api/health'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Error handling middleware
app.use(errorHandler);

// Only start server if this file is run directly (not imported)
const isMainModule = process.argv[1]?.includes('app.js');
if (isMainModule) {
  app.listen(PORT, () => {
    console.log(`Mobius Ledger backend running on port ${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
