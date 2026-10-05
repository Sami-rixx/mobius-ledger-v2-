import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, logout, me, changePassword } from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import { csrfProtection } from '../middleware/csrf.js';

const router = Router();

// Stricter brute-force protection specifically on the login endpoint, on
// top of the per-account lockout enforced in authController.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many login attempts, please try again later.' }
});

// Public: no session required yet.
router.post('/login', loginLimiter, login);

// Everything below requires an authenticated session.
router.use(authenticate);

router.get('/me', me);
router.post('/logout', csrfProtection, logout);
router.post('/change-password', csrfProtection, changePassword);

export default router;
