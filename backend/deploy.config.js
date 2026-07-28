/**
 * Mobius Ledger v2 - Backend Deployment Configuration
 * 
 * This file contains deployment-specific configuration for production environments.
 * Copy this to config/production.js and customize for your deployment.
 */

const path = require('path');

module.exports = {
  // Server Configuration
  server: {
    port: process.env.PORT || 3000,
    host: process.env.HOST || '0.0.0.0',
    environment: process.env.NODE_ENV || 'production',
    
    // Security
    trustProxy: true, // Enable if behind a proxy (nginx, load balancer)
    
    // Rate Limiting
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP, please try again later'
    },
    
    // Body Parser
    bodyLimit: '10mb',
    jsonLimit: '10mb',
    urlencodedLimit: '10mb'
  },
  
  // Database Configuration
  database: {
    // SQLite database path
    // In production, consider using an absolute path
    path: process.env.DATABASE_PATH || path.join(__dirname, '..', 'database', 'mobius_ledger.db'),
    
    // SQLite WAL mode settings for production
    walMode: true,
    foreignKeys: true,
    
    // Performance settings for production
    cacheSize: -10000, // 10MB cache (negative = in bytes)
    mmapSize: 30 * 1024 * 1024 * 1024, // 30GB mmap size
    busyTimeout: 5000, // 5 seconds
    
    // Backup settings
    backupEnabled: true,
    backupPath: process.env.BACKUP_PATH || path.join(__dirname, '..', 'backups'),
    backupFrequency: 'daily', // daily, weekly, manual
    maxBackups: 30 // Maximum number of backups to keep
  },
  
  // CORS Configuration
  cors: {
    origin: process.env.CORS_ORIGIN || '*', // Set to specific domains in production
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
  },
  
  // Compression Configuration
  compression: {
    enabled: true,
    level: 6, // Optimal compression level (1-9)
    threshold: 0, // Compress all responses
    filter: (req, res) => {
      // Don't compress responses with this header
      if (res.getHeader('x-no-compression')) {
        return false;
      }
      return true;
    }
  },
  
  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info', // error, warn, info, verbose, debug, silly
    directory: process.env.LOG_DIR || path.join(__dirname, '..', 'logs'),
    maxFiles: 30, // Maximum number of log files
    maxSize: 10 * 1024 * 1024 // 10MB per file
  },
  
  // Session Configuration (for future authentication)
  session: {
    secret: process.env.SESSION_SECRET || 'change-this-to-a-strong-secret-in-production',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  },
  
  // File Upload Configuration
  upload: {
    tempDir: process.env.TEMP_DIR || path.join(__dirname, '..', 'temp'),
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf', '.csv', '.sql']
  }
};
