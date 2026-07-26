import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { errorHandler } from './middleware/errorHandler.js';
import { setupDatabase } from './config/database.js';
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

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Rate limiting (100 requests per 15 minutes)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later.' }
});
app.use(limiter);

// Request logging
app.use(morgan('dev'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Database setup
setupDatabase();

// API routes
app.use('/api/health', healthRoutes);
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
