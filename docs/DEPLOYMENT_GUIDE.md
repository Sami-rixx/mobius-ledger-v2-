# Mobius Ledger v2 - Deployment Guide

This comprehensive guide covers all aspects of deploying Mobius Ledger v2 in production environments.

---

## Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites](#prerequisites)
3. [Environment Configuration](#environment-configuration)
4. [Backend Deployment](#backend-deployment)
5. [Frontend Deployment](#frontend-deployment)
6. [Full Stack Deployment](#full-stack-deployment)
7. [Production Configuration](#production-configuration)
8. [Deployment Scripts](#deployment-scripts)
9. [Server Configuration](#server-configuration)
10. [Database Considerations](#database-considerations)
11. [Security Considerations](#security-considerations)
12. [Performance Optimization](#performance-optimization)
13. [Monitoring and Logging](#monitoring-and-logging)
14. [Backup and Recovery](#backup-and-recovery)
15. [Troubleshooting](#troubleshooting)

---

## Deployment Overview

Mobius Ledger v2 consists of two main components:

1. **Backend**: Node.js + Express server (port 3000 by default)
2. **Frontend**: React 18 + Vite application (port 5173 by default in development, configurable in production)

### Deployment Options

| Option | Description | Complexity | Recommended For |
|--------|-------------|------------|-----------------|
| Single Server | Backend and frontend on one server | Low | Small deployments, testing |
| Two Servers | Backend and frontend on separate servers | Medium | Production with high traffic |
| Containerized | Docker containers (future milestone) | Medium | Cloud deployments, scalability |
| Serverless | Backend as serverless, frontend static | High | Cloud-native deployments |

---

## Prerequisites

### System Requirements

#### Minimum
- Node.js: v22+
- npm: v10+
- RAM: 2GB (4GB recommended)
- CPU: 2 cores
- Storage: 5GB free disk space
- OS: Linux (Ubuntu 22.04 LTS recommended), macOS, or Windows 10+

#### Recommended for Production
- Node.js: v24+ (LTS)
- npm: v10+
- RAM: 4GB (8GB for high traffic)
- CPU: 4 cores
- Storage: 20GB SSD
- OS: Linux (Ubuntu 22.04 LTS)

### Required Tools
- Git
- Node.js and npm
- A process manager (recommended: PM2, forever, or systemd)
- A web server (recommended: nginx or Apache) for frontend serving
- SQLite (included in most systems)

### Installation on Ubuntu 22.04 LTS

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js (using NodeSource)
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install Git
sudo apt install -y git

# Install build tools (if needed)
sudo apt install -y build-essential

# Verify installation
node --version  # Should be v22+
npm --version   # Should be v10+
git --version   # Should be v2+
```

---

## Environment Configuration

### Environment Variables

Create a `.env` file in the `backend/` directory:

```bash
# Environment
NODE_ENV=production

# Server
PORT=3000
HOST=0.0.0.0

# Database
DATABASE_PATH=../database/mobius_ledger.db

# Security
SESSION_SECRET=your-strong-random-secret-here
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info
LOG_DIR=./logs

# File Uploads
TEMP_DIR=./temp
MAX_FILE_SIZE=52428800
```

**Important**: Generate a strong `SESSION_SECRET` using:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Production Configuration File

Copy `backend/deploy.config.js` to `backend/config/production.js` and customize as needed:

```javascript
const deployConfig = require('../deploy.config.js');

module.exports = {
  ...deployConfig,
  // Override any defaults here
  server: {
    ...deployConfig.server,
    port: 8080, // Custom port
  },
  database: {
    ...deployConfig.database,
    path: '/var/lib/mobius-ledger/mobius_ledger.db',
  },
};
```

---

## Backend Deployment

### Option 1: Using PM2 (Recommended)

PM2 is a production process manager for Node.js applications with zero-downtime reloads.

#### Install PM2

```bash
npm install -g pm2
pm2 --version
```

#### Deploy with PM2

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install --production

# Start the backend
pm2 start src/app.js --name "mobius-ledger-backend"

# Save the process list
pm2 save

# Generate startup script
pm2 startup

# Save current process list to startup script
pm2 save
```

#### PM2 Commands

```bash
# List running processes
pm2 list

# View logs
pm2 logs mobius-ledger-backend
pm2 logs --lines 100
pm2 logs --err
pm2 logs --out

# Monitor in real-time
pm2 monit

# Restart
pm2 restart mobius-ledger-backend

# Stop
pm2 stop mobius-ledger-backend

# Delete
pm2 delete mobius-ledger-backend

# Reload (zero-downtime)
pm2 reload mobius-ledger-backend
```

### Option 2: Using Deployment Script

```bash
# Make the script executable (if not already)
chmod +x scripts/deploy-backend.sh

# Start backend
./scripts/deploy-backend.sh start

# Check status
./scripts/deploy-backend.sh status

# Stop backend
./scripts/deploy-backend.sh stop

# Restart backend
./scripts/deploy-backend.sh restart
```

### Option 3: Manual Deployment

```bash
cd backend
npm install --production
NODE_ENV=production node src/app.js &
```

---

## Frontend Deployment

### Build for Production

```bash
cd frontend
npm install --production
npm run build
```

The production build will be created in the `frontend/dist/` directory.

### Serve the Production Build

#### Option 1: Using Vite Preview

```bash
cd frontend
npm run preview -- --port 5173
```

#### Option 2: Using nginx

1. Install nginx:
   ```bash
   sudo apt install -y nginx
   ```

2. Configure nginx:
   ```bash
   sudo nano /etc/nginx/sites-available/mobius-ledger
   ```

   Add the following configuration:
   ```nginx
   server {
       listen 80;
       server_name yourdomain.com;
       
       root /path/to/mobius-ledger-v2/frontend/dist;
       index index.html;
       
       location / {
           try_files $uri $uri/ /index.html;
       }
       
       location /api/ {
           proxy_pass http://localhost:3000/api/;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
       
       # Error pages
       error_page 404 /index.html;
       error_page 500 502 503 504 /50x.html;
       location = /50x.html {
           root /usr/share/nginx/html;
       }
   }
   ```

3. Enable the site:
   ```bash
   sudo ln -s /etc/nginx/sites-available/mobius-ledger /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl restart nginx
   ```

#### Option 3: Using Apache

1. Install Apache:
   ```bash
   sudo apt install -y apache2
   ```

2. Configure Apache:
   ```bash
   sudo nano /etc/apache2/sites-available/mobius-ledger.conf
   ```

   Add the following configuration:
   ```apache
   <VirtualHost *:80>
       ServerName yourdomain.com
       DocumentRoot /path/to/mobius-ledger-v2/frontend/dist
       
       <Directory /path/to/mobius-ledger-v2/frontend/dist>
           Options Indexes FollowSymLinks
           AllowOverride All
           Require all granted
       </Directory>
       
       # Proxy API requests to backend
       ProxyPass /api/ http://localhost:3000/api/
       ProxyPassReverse /api/ http://localhost:3000/api/
       
       ErrorLog ${APACHE_LOG_DIR}/mobius-ledger-error.log
       CustomLog ${APACHE_LOG_DIR}/mobius-ledger-access.log combined
   </VirtualHost>
   ```

3. Enable the site and proxy modules:
   ```bash
   sudo a2enmod proxy proxy_http
   sudo a2ensite mobius-ledger.conf
   sudo systemctl restart apache2
   ```

#### Option 4: Using Deployment Script

```bash
# Make the script executable (if not already)
chmod +x scripts/deploy-frontend.sh

# Build frontend
./scripts/deploy-frontend.sh build

# Serve on custom port
./scripts/deploy-frontend.sh serve 8080

# Get deployment info
./scripts/deploy-frontend.sh info
```

---

## Full Stack Deployment

### Using the Master Deployment Script

```bash
# Make the script executable
chmod +x scripts/deploy.sh

# Get help
git clone https://github.com/Sami-rixx/mobius-ledger-v2-.git
cd mobius-ledger-v2-
chmod +x scripts/*.sh
./scripts/deploy.sh help

# Full deployment
./scripts/deploy.sh full

# Full deployment with custom frontend port
./scripts/deploy.sh full 8080

# Check status
./scripts/deploy.sh status

# Stop all services
./scripts/deploy.sh stop
```

### Manual Full Deployment

1. **Deploy Backend**:
   ```bash
   cd backend
   npm install --production
   pm2 start src/app.js --name "mobius-ledger-backend"
   pm2 save
   pm2 startup
   ```

2. **Deploy Frontend**:
   ```bash
   cd ../frontend
   npm install --production
   npm run build
   ```

3. **Configure Web Server**:
   - Set up nginx or Apache as described above
   - Configure proxy for `/api/` requests to `http://localhost:3000`

4. **Set Up Systemd Services (Optional)**:
   - Create systemd service for backend auto-start

---

## Production Configuration

### Recommended Production Settings

The following settings in `backend/config/production.js` are recommended for production:

```javascript
{
  server: {
    port: 3000,
    host: '0.0.0.0',
    environment: 'production',
    trustProxy: true, // Important when behind nginx/Apache
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000 // requests per window
    }
  },
  
  database: {
    path: '/var/lib/mobius-ledger/mobius_ledger.db',
    walMode: true,
    foreignKeys: true,
    cacheSize: -10000, // 10MB
    mmapSize: 30 * 1024 * 1024 * 1024, // 30GB
    busyTimeout: 5000
  },
  
  cors: {
    origin: 'https://yourdomain.com', // Restrict to your domain
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true
  },
  
  compression: {
    enabled: true,
    level: 6
  },
  
  logging: {
    level: 'info',
    directory: '/var/log/mobius-ledger'
  }
}
```

---

## Deployment Scripts

The repository includes the following deployment scripts:

| Script | Description | Usage |
|--------|-------------|-------|
| `scripts/deploy.sh` | Master deployment script | `./scripts/deploy.sh [backend\|frontend\|full\|status\|stop]` |
| `scripts/deploy-backend.sh` | Backend deployment | `./scripts/deploy-backend.sh [start\|stop\|restart\|status]` |
| `scripts/deploy-frontend.sh` | Frontend deployment | `./scripts/deploy-frontend.sh [build\|serve\|deploy\|info]` |

### Deployment Script Features

- **Color-coded output** for better visibility
- **Error handling** with descriptive messages
- **Automatic directory creation** for logs and temp files
- **Environment file generation** with defaults
- **Process management** (supports forever and native node)
- **Status checking** for running services

---

## Server Configuration

### nginx Configuration Example

```nginx
# /etc/nginx/nginx.conf
user www-data;
worker_processes auto;
pid /run/nginx.pid;
include /etc/nginx/modules-enabled/*.conf;

events {
    worker_connections 1024;
}

http {
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    server_tokens off;
    
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;
    
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
    
    include /etc/nginx/conf.d/*.conf;
    include /etc/nginx/sites-enabled/*;
}
```

### nginx Site Configuration

```nginx
# /etc/nginx/sites-available/mobius-ledger
upstream backend {
    server localhost:3000;
    keepalive 32;
}

server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    
    root /path/to/mobius-ledger-v2/frontend/dist;
    index index.html;
    
    # Frontend routes
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Static assets
    location /assets/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        try_files $uri =404;
    }
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Error pages
    error_page 404 /index.html;
    error_page 500 502 503 504 /50x.html;
    
    # Logging
    access_log /var/log/nginx/mobius-ledger-access.log;
    error_log /var/log/nginx/mobius-ledger-error.log;
}

# HTTPS configuration (recommended)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;
    
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/yourdomain.com/chain.pem;
    
    # SSL settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Rest of the configuration is the same as the HTTP server
    root /path/to/mobius-ledger-v2/frontend/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    location /api/ {
        proxy_pass http://backend/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Redirect HTTP to HTTPS
    if ($scheme != "https") {
        return 301 https://$host$request_uri;
    }
}
```

---

## Database Considerations

### Database Location

In production, store the SQLite database in a dedicated directory:
- **Recommended**: `/var/lib/mobius-ledger/mobius_ledger.db`
- **Permissions**: Ensure the Node.js process has read/write access

```bash
# Create database directory
sudo mkdir -p /var/lib/mobius-ledger

# Set ownership (assuming node runs as www-data or a specific user)
sudo chown -R www-data:www-data /var/lib/mobius-ledger

# Set permissions
sudo chmod -R 750 /var/lib/mobius-ledger
```

### Database Backup

Regular backups are essential for data safety. The application includes backup functionality.

#### Manual Backup

```bash
# Create backup
cp /var/lib/mobius-ledger/mobius_ledger.db /var/lib/mobius-ledger/backups/mobius_ledger-$(date +%Y%m%d-%H%M%S).db

# Compress backup
gzip /var/lib/mobius-ledger/backups/mobius_ledger-$(date +%Y%m%d-%H%M%S).db
```

#### Automated Backup with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * cp /var/lib/mobius-ledger/mobius_ledger.db /var/lib/mobius-ledger/backups/mobius_ledger-$(date +\%Y\%m\%d).db && gzip /var/lib/mobius-ledger/backups/mobius_ledger-$(date +\%Y\%m\%d).db

# Add weekly full backup and cleanup old backups
0 3 * * 0 cp /var/lib/mobius-ledger/mobius_ledger.db /var/lib/mobius-ledger/backups/weekly/mobius_ledger-$(date +\%Y\%m\%d).db && find /var/lib/mobius-ledger/backups/daily -mtime +30 -delete
```

---

## Security Considerations

### Backend Security

1. **Use HTTPS**: Always use HTTPS in production with valid certificates
2. **Secure Headers**: Configure proper security headers (Helmet is already configured)
3. **Rate Limiting**: Configure appropriate rate limits in `deploy.config.js`
4. **CORS**: Restrict CORS origins to your domain only
5. **Session Security**: Use secure, HttpOnly cookies with a strong secret
6. **Environment Variables**: Never commit `.env` files to version control

### Frontend Security

1. **HTTPS**: Serve frontend over HTTPS
2. **Content Security Policy**: Consider adding CSP headers
3. **Static Files**: Ensure static files are served with proper cache headers

### Network Security

1. **Firewall**: Configure firewall to allow only necessary ports (80, 443, 3000 for backend)
2. **Fail2Ban**: Install and configure Fail2Ban to prevent brute force attacks
3. **SSH Security**: Disable root login and use SSH keys

### SSL Certificates

Use Let's Encrypt for free SSL certificates:

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo certbot renew --dry-run
```

---

## Performance Optimization

### Backend Performance

1. **SQLite WAL Mode**: Already enabled for concurrent reads and writes
2. **Connection Pooling**: SQLite handles this internally
3. **Caching**: Consider adding Redis for session and data caching (future milestone)
4. **Database Indexes**: The schema already includes necessary indexes

### Frontend Performance

1. **Production Build**: Always use `npm run build` for production
2. **Compression**: Gzip compression is enabled in `app.js`
3. **Cache Headers**: Configure proper cache headers for static assets
4. **Lazy Loading**: Already implemented for React components
5. **Code Splitting**: Configured in `vite.config.js`

### Load Testing

Before deploying to production, perform load testing:

```bash
# Install autocannon
npm install -g autocannon

# Test backend endpoints
autocannon -c 100 -d 60 -m GET http://localhost:3000/api/health
```

---

## Monitoring and Logging

### Backend Logging

Logs are written to the directory specified in the configuration. By default, they go to `backend/logs/`.

### Log Rotation

Configure log rotation using logrotate:

```bash
# Create logrotate configuration
sudo nano /etc/logrotate.d/mobius-ledger-backend
```

```conf
/path/to/mobius-ledger-v2/backend/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    sharedscripts
    postrotate
        systemctl reload nginx
    endscript
}
```

### Process Monitoring

Use PM2's built-in monitoring:

```bash
# Monitor all processes
pm2 monit

# View dashboard
pm2 plus
```

### System Monitoring

Install and configure monitoring tools:

```bash
# Install htop for process monitoring
sudo apt install -y htop

# Install netdata for system monitoring
bash <(curl -Ss https://my-netdata.io/kickstart.sh)
```

---

## Backup and Recovery

### Database Backup

The application includes a backup API endpoint that can be used for automated backups:

```bash
# Trigger backup via API
curl -X POST http://localhost:3000/api/import-export/backup \
  -H "Content-Type: application/json" \
  -d '{"filename": "backup-$(date +%Y%m%d-%H%M%S).sql"}'

# List backups
curl http://localhost:3000/api/import-export/backups

# Download backup
# Backups are stored in backend/backups/ by default
```

### Full System Backup

```bash
# Create backup directory
mkdir -p /backups/mobius-ledger

# Backup database
cp /var/lib/mobius-ledger/mobius_ledger.db /backups/mobius-ledger/

# Backup application files
cp -r /path/to/mobius-ledger-v2 /backups/mobius-ledger/code-
$(date +%Y%m%d-%H%M%S)

# Create compressed archive
tar -czvf /backups/mobius-ledger/full-backup-$(date +%Y%m%d-%H%M%S).tar.gz \
  /backups/mobius-ledger/mobius_ledger.db \
  /backups/mobius-ledger/code-$(date +%Y%m%d-%H%M%S)
```

### Disaster Recovery

1. **Restore from Backup**:
   ```bash
   # Stop the backend
   pm2 stop mobius-ledger-backend
   
   # Restore database
   cp /backups/mobius-ledger/mobius_ledger-20240101.db /var/lib/mobius-ledger/mobius_ledger.db
   
   # Restore code
   cp -r /backups/mobius-ledger/code-20240101/* /path/to/mobius-ledger-v2/
   
   # Install dependencies
   cd /path/to/mobius-ledger-v2/backend
   npm install --production
   
   cd ../frontend
   npm install --production
   npm run build
   
   # Start the backend
   pm2 start mobius-ledger-backend
   ```

2. **Restore from API Backup**:
   ```bash
   # Upload backup file
   curl -X POST http://localhost:3000/api/import-export/restore \
     -F "file=@/path/to/backup.sql"
   ```

---

## Troubleshooting

### Backend Won't Start

1. **Check logs**:
   ```bash
   pm2 logs mobius-ledger-backend
   cat backend/logs/backend-err.log
   ```

2. **Check database connection**:
   ```bash
   sqlite3 /var/lib/mobius-ledger/mobius_ledger.db "SELECT COUNT(*) FROM students;"
   ```

3. **Check port availability**:
   ```bash
   netstat -tulnp | grep 3000
   lsof -i :3000
   ```

4. **Check Node.js version**:
   ```bash
   node --version
   ```

### Frontend Build Fails

1. **Check Node.js version**: Ensure v22+ is installed
2. **Clear node_modules and reinstall**:
   ```bash
   cd frontend
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```
3. **Check for import errors**: Use `@` alias imports instead of relative paths above `src/`

### Database Connection Errors

1. **Check database path**: Ensure the path in `.env` is correct
2. **Check permissions**: Ensure the Node.js process can access the database file
3. **Check database integrity**:
   ```bash
   sqlite3 /var/lib/mobius-ledger/mobius_ledger.db "PRAGMA integrity_check;"
   ```

### API Requests Failing

1. **Check CORS configuration**: Ensure the frontend domain is allowed
2. **Check proxy configuration**: Ensure `/api/` requests are proxied to the backend
3. **Check backend logs**: Look for errors in the backend logs

### Performance Issues

1. **Check memory usage**:
   ```bash
   htop
   free -h
   ```
2. **Check database performance**:
   ```bash
   sqlite3 /var/lib/mobius-ledger/mobius_ledger.db "PRAGMA cache_size;"
   ```
3. **Check for slow queries**: Review database indexes

---

## Checklist Before Going Live

- [ ] Node.js v22+ installed
- [ ] All dependencies installed (`npm install --production`)
- [ ] Environment variables configured (`.env` file)
- [ ] Production configuration created (`backend/config/production.js`)
- [ ] Database exists and is accessible
- [ ] Backend starts without errors
- [ ] Frontend builds successfully
- [ ] Web server configured (nginx/Apache)
- [ ] SSL certificates installed
- [ ] HTTPS configured
- [ ] Firewall configured
- [ ] Backup strategy in place
- [ ] Monitoring configured
- [ ] Error tracking configured
- [ ] All tests pass (in suitable environment)
- [ ] Security headers configured
- [ ] CORS configured correctly
- [ ] Rate limiting configured

---

## Maintenance Tasks

### Regular Maintenance

1. **Update Dependencies**:
   ```bash
   cd backend
   npm outdated
   npm update
   
   cd ../frontend
   npm outdated
   npm update
   ```

2. **Database Optimization**:
   ```bash
   sqlite3 /var/lib/mobius-ledger/mobius_ledger.db "VACUUM;"
   sqlite3 /var/lib/mobius-ledger/mobius_ledger.db "ANALYZE;"
   ```

3. **Clean Up Old Logs**:
   ```bash
   find /var/log/mobius-ledger -mtime +30 -delete
   ```

4. **Clean Up Old Backups**:
   ```bash
   find /var/lib/mobius-ledger/backups -mtime +30 -delete
   ```

### Upgrading Mobius Ledger

1. **Backup everything**: Database, configuration files, customizations
2. **Pull latest changes**:
   ```bash
   cd /path/to/mobius-ledger-v2
   git pull origin main
   ```
3. **Update dependencies**:
   ```bash
   cd backend
   npm install --production
   
   cd ../frontend
   npm install --production
   npm run build
   ```
4. **Test the upgrade**: Verify everything works in a staging environment
5. **Deploy to production**: Follow the deployment steps above

---

## Additional Resources

- [README.md](../README.md) - Project overview and setup
- [ARCHITECTURE.md](../ARCHITECTURE.md) - Architecture and patterns
- [CURRENT_MILESTONE.md](../CURRENT_MILESTONE.md) - Current development status
- [TESTING_PLAN.md](./TESTING_PLAN.md) - Testing strategy and blockage information
- [Vite Documentation](https://vitejs.dev/guide/) - Vite configuration
- [Express Documentation](https://expressjs.com/) - Express.js framework
- [SQLite Documentation](https://www.sqlite.org/docs.html) - SQLite database

---

*This deployment guide is updated as part of Milestone 18 - Phase 8 (Deployment Preparation).*
