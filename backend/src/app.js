import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middleware/errorHandler.js';
import { setupDatabase } from './config/database.js';
import { authenticate, requirePermission } from './middleware/auth.js';
import { csrfProtection } from './middleware/csrf.js';
import healthRoutes from './routes/healthRoutes.js';
import authRoutes from './routes/authRoutes.js';
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
import permissionRoutes from './routes/permissionRoutes.js';
import roleRoutes from './routes/roleRoutes.js';
import userRoleRoutes from './routes/userRoleRoutes.js';
import rolePermissionRoutes from './routes/rolePermissionRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import dailyLedgerRoutes from './routes/dailyLedgerRoutes.js';
import importExportRoutes from './routes/importExportRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// The app is designed to sit behind a reverse proxy (nginx/Caddy) in
// production (see docs/DEPLOYMENT.md). Trusting the proxy's X-Forwarded-*
// headers is required for req.ip / req.secure / rate limiting to see the
// real client, and for `cookie: { secure: true }` to work correctly behind
// TLS termination.
if (process.env.TRUST_PROXY) {
  app.set('trust proxy', process.env.TRUST_PROXY === 'true' ? 1 : process.env.TRUST_PROXY);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginResourcePolicy: { policy: 'same-site' }
}));

// CORS: same-origin deployment is the default/preferred posture (see
// security architecture spec section 10). FRONTEND_URL is the only origin
// ever allowed to send credentialed requests; wildcard origins are never
// combined with credentials.
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(cors({
  origin: allowedOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-csrf-token', 'Idempotency-Key']
}));

// Cookies (session token lives in an HttpOnly cookie - see middleware/auth.js)
app.use(cookieParser());

// Rate limiting (general API traffic; /api/auth/login has its own, tighter
// limiter - see routes/authRoutes.js)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

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

// Database setup (applies schema + numbered migrations; must complete
// before any route handler can touch the database).
await setupDatabase();

// ---------------------------------------------------------------------
// Public routes: health/readiness probes and authentication.
// Everything else below this point requires a valid, non-expired,
// non-revoked server-side session (see middleware/auth.js#authenticate).
// Production-readiness rule from the security architecture spec: "the
// system is not production-ready ... until all P0 controls ... are
// green" - this global `authenticate` gate is the P0 control that closes
// the "no functioning authentication/authorization boundary" finding.
// ---------------------------------------------------------------------
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);

app.use('/api', authenticate);
app.use('/api', csrfProtection);

// API routes - each router applies its own requirePermission(...) checks
// per-route (see individual route files for the permission matrix).
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
app.use('/api/users', requirePermission('users.manage'), userRoutes);
app.use('/api/user-sessions', requirePermission('sessions.manage'), userSessionRoutes);
app.use('/api/permissions', requirePermission('roles.manage'), permissionRoutes);
app.use('/api/roles', requirePermission('roles.manage'), roleRoutes);
app.use('/api/user-roles', requirePermission('users.manage'), userRoleRoutes);
app.use('/api/role-permissions', requirePermission('roles.manage'), rolePermissionRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/daily-ledger', dailyLedgerRoutes);
app.use('/api/import-export', requirePermission('import.export'), importExportRoutes);
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
  // Bind explicitly to 0.0.0.0 by default so the app works identically
  // behind a container/reverse-proxy or directly on a VPS; set HOST=127.0.0.1
  // to restrict to loopback-only when the reverse proxy runs on the same host.
  const HOST = process.env.HOST || '0.0.0.0';
  app.listen(PORT, HOST, () => {
    console.log(`Mobius Ledger backend running on ${HOST}:${PORT}`);
    console.log(`Health check: http://localhost:${PORT}/api/health`);
  });
}

export default app;
