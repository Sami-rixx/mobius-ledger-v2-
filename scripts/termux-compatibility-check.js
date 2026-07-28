/**
 * Mobius Ledger v2 - Termux Compatibility Verification Script
 * 
 * This script verifies the compatibility of Mobius Ledger v2 with the Termux environment.
 * It checks for required dependencies, tests various functionalities, and identifies
 * Termux-specific limitations.
 * 
 * Usage: node scripts/termux-compatibility-check.js
 */

const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const os = require('os');

// ANSI color codes for output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

class CompatibilityChecker {
  constructor() {
    this.results = {
      passed: [],
      failed: [],
      warnings: [],
      info: []
    };
    this.projectDir = path.resolve(__dirname, '..');
    this.isTermux = this.detectTermux();
    this.isAndroid = os.platform() === 'android' || process.env.ANDROID_ROOT !== undefined;
  }

  // Utility methods
  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logPass(message) {
    console.log(`${colors.green}✓${colors.reset} ${message}`);
    this.results.passed.push(message);
  }

  logFail(message) {
    console.log(`${colors.red}✗${colors.reset} ${message}`);
    this.results.failed.push(message);
  }

  logWarn(message) {
    console.log(`${colors.yellow}⚠${colors.reset} ${message}`);
    this.results.warnings.push(message);
  }

  logInfo(message) {
    console.log(`${colors.blue}ℹ${colors.reset} ${message}`);
    this.results.info.push(message);
  }

  detectTermux() {
    return process.env.PREFIX !== undefined && process.env.PREFIX.includes('com.termux');
  }

  // Check methods
  checkNodeVersion() {
    this.logInfo('Checking Node.js version...');
    try {
      const version = execSync('node --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(version.replace('v', '').split('.')[0]);
      
      if (majorVersion >= 22) {
        this.logPass(`Node.js ${version} (minimum v22+ required)`);
      } else {
        this.logFail(`Node.js ${version} - Version < 22 is not supported`);
      }
    } catch (error) {
      this.logFail('Node.js is not installed');
    }
  }

  checkNpmVersion() {
    this.logInfo('Checking npm version...');
    try {
      const version = execSync('npm --version', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(version.split('.')[0]);
      
      if (majorVersion >= 10) {
        this.logPass(`npm ${version} (minimum v10+ recommended)`);
      } else {
        this.logWarn(`npm ${version} - Consider upgrading to v10+`);
      }
    } catch (error) {
      this.logFail('npm is not installed');
    }
  }

  checkGit() {
    this.logInfo('Checking Git...');
    try {
      const version = execSync('git --version', { encoding: 'utf8' }).trim();
      this.logPass(`Git ${version}`);
    } catch (error) {
      this.logFail('Git is not installed');
    }
  }

  checkPython() {
    this.logInfo('Checking Python...');
    try {
      const version = execSync('python3 --version 2>/dev/null || python --version 2>/dev/null', { encoding: 'utf8' }).trim();
      const majorVersion = parseInt(version.replace('Python ', '').split('.')[0]);
      
      if (majorVersion >= 3) {
        this.logPass(`Python ${version} (required for native module compilation)`);
      } else {
        this.logWarn(`Python ${version} - Python 3+ recommended`);
      }
    } catch (error) {
      this.logWarn('Python is not installed (required for native module compilation)');
    }
  }

  checkGcc() {
    this.logInfo('Checking GCC/Clang...');
    try {
      const gccVersion = execSync('gcc --version 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
      const clangVersion = execSync('clang --version 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
      
      if (gccVersion) {
        this.logPass(`GCC: ${gccVersion}`);
      } else if (clangVersion) {
        this.logPass(`Clang: ${clangVersion}`);
      } else {
        this.logFail('No C compiler found (GCC or Clang)');
      }
    } catch (error) {
      this.logFail('No C compiler found (GCC or Clang)');
    }
  }

  checkMake() {
    this.logInfo('Checking Make...');
    try {
      const version = execSync('make --version 2>/dev/null | head -1', { encoding: 'utf8' }).trim();
      this.logPass(`Make: ${version}`);
    } catch (error) {
      this.logFail('Make is not installed');
    }
  }

  checkSqlite() {
    this.logInfo('Checking SQLite...');
    try {
      const version = execSync('sqlite3 --version', { encoding: 'utf8' }).trim();
      this.logPass(`SQLite: ${version}`);
    } catch (error) {
      this.logWarn('SQLite CLI is not installed');
    }
  }

  checkAndroidNdk() {
    this.logInfo('Checking Android NDK (for native module compilation)...');
    
    if (!this.isAndroid) {
      this.logPass('Not running on Android - NDK not required');
      return;
    }
    
    const ndkPath = process.env.ANDROID_NDK_PATH;
    if (ndkPath && fs.existsSync(ndkPath)) {
      this.logPass(`Android NDK: ${ndkPath}`);
    } else {
      this.logFail('Android NDK is not configured (required for better-sqlite3 compilation)');
      this.logWarn('Node-gyp cannot compile native modules without NDK configuration');
    }
  }

  checkProjectStructure() {
    this.logInfo('Checking project structure...');
    
    const requiredDirs = [
      'backend/src',
      'frontend/src',
      'database'
    ];
    
    const requiredFiles = [
      'backend/package.json',
      'frontend/package.json',
      'backend/src/app.js',
      'database/schema.sql'
    ];
    
    for (const dir of requiredDirs) {
      const fullPath = path.join(this.projectDir, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        this.logPass(`Directory exists: ${dir}`);
      } else {
        this.logFail(`Directory missing: ${dir}`);
      }
    }
    
    for (const file of requiredFiles) {
      const fullPath = path.join(this.projectDir, file);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
        this.logPass(`File exists: ${file}`);
      } else {
        this.logFail(`File missing: ${file}`);
      }
    }
  }

  checkBackendDependencies() {
    this.logInfo('Checking backend dependencies...');
    
    const packageJsonPath = path.join(this.projectDir, 'backend', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.logFail('backend/package.json not found');
      return;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = packageJson.dependencies || {};
      
      // Check for critical dependencies
      const criticalDeps = ['express', 'better-sqlite3', 'helmet', 'cors'];
      for (const dep of criticalDeps) {
        if (dependencies[dep]) {
          this.logPass(`Dependency: ${dep}@${dependencies[dep]}`);
        } else {
          this.logFail(`Missing dependency: ${dep}`);
        }
      }
      
      // Warn about better-sqlite3 in Termux
      if (dependencies['better-sqlite3'] && this.isTermux) {
        this.logWarn('better-sqlite3 cannot be compiled in Termux without Android NDK');
        this.logWarn('Consider using --ignore-scripts for development, or switch to a different environment for production');
      }
    } catch (error) {
      this.logFail('Failed to parse backend/package.json');
    }
  }

  checkFrontendDependencies() {
    this.logInfo('Checking frontend dependencies...');
    
    const packageJsonPath = path.join(this.projectDir, 'frontend', 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      this.logFail('frontend/package.json not found');
      return;
    }
    
    try {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
      const dependencies = packageJson.dependencies || {};
      
      // Check for critical dependencies
      const criticalDeps = ['react', 'react-dom', 'react-router-dom', 'vite'];
      for (const dep of criticalDeps) {
        if (dependencies[dep]) {
          this.logPass(`Dependency: ${dep}@${dependencies[dep]}`);
        } else {
          this.logFail(`Missing dependency: ${dep}`);
        }
      }
    } catch (error) {
      this.logFail('Failed to parse frontend/package.json');
    }
  }

  checkDeploymentScripts() {
    this.logInfo('Checking deployment scripts...');
    
    const scriptDir = path.join(this.projectDir, 'scripts');
    const scripts = ['deploy.sh', 'deploy-backend.sh', 'deploy-frontend.sh'];
    
    for (const script of scripts) {
      const fullPath = path.join(scriptDir, script);
      if (fs.existsSync(fullPath)) {
        const stats = fs.statSync(fullPath);
        const isExecutable = (stats.mode & fs.constants.S_IXUSR) !== 0;
        
        if (isExecutable) {
          this.logPass(`Deployment script: ${script} (executable)`);
        } else {
          this.logWarn(`Deployment script: ${script} (not executable - run chmod +x)`);
        }
      } else {
        this.logFail(`Deployment script missing: ${script}`);
      }
    }
  }

  checkMobileResponsiveness() {
    this.logInfo('Checking mobile responsiveness configuration...');
    
    const scssPath = path.join(this.projectDir, 'frontend', 'src', 'styles', 'index.scss');
    if (fs.existsSync(scssPath)) {
      const content = fs.readFileSync(scssPath, 'utf8');
      
      if (content.includes('@media (max-width:')) {
        this.logPass('Mobile-specific styles found in index.scss');
      } else {
        this.logWarn('No mobile-specific styles found');
      }
      
      if (content.includes('48px') || content.includes('44px')) {
        this.logPass('Touch-friendly dimensions found');
      } else {
        this.logWarn('No touch-friendly dimensions found');
      }
    } else {
      this.logFail('frontend/src/styles/index.scss not found');
    }
  }

  checkTermuxWorkarounds() {
    this.logInfo('Checking Termux-specific workarounds...');
    
    if (this.isTermux) {
      this.logWarn('Running in Termux - some features may have limitations');
      
      // Check if --ignore-scripts is being used
      const packageLockPath = path.join(this.projectDir, 'backend', 'package-lock.json');
      if (fs.existsSync(packageLockPath)) {
        this.logInfo('Consider using npm install --ignore-scripts in Termux to skip native compilation');
      }
      
      // Check for better-sqlite3 alternatives
      this.logWarn('better-sqlite3 cannot be compiled in Termux - backend will fail at runtime without workarounds');
      this.logWarn('Workaround: Use npm install --ignore-scripts, but backend database operations will fail');
      this.logWarn('Alternative: Use a Linux/macOS/Windows environment for full functionality');
      
      // Check for deployment script compatibility
      this.logInfo('Deployment scripts may need adjustment for Termux (bash, mkdir, etc. are available)');
    } else {
      this.logPass('Not running in Termux - no Termux-specific limitations');
    }
  }

  checkViteBuild() {
    this.logInfo('Checking Vite production build capability...');
    
    try {
      const viteConfigPath = path.join(this.projectDir, 'frontend', 'vite.config.js');
      if (fs.existsSync(viteConfigPath)) {
        this.logPass('Vite configuration file found');
        
        const content = fs.readFileSync(viteConfigPath, 'utf8');
        if (content.includes('base:')) {
          this.logPass('Vite base configuration found');
        }
        if (content.includes('resolve.alias')) {
          this.logPass('Vite alias configuration found');
        }
        
        // Test if vite is available
        try {
          const viteVersion = execSync('npx vite --version 2>/dev/null', { 
            encoding: 'utf8',
            cwd: path.join(this.projectDir, 'frontend')
          }).trim();
          this.logPass(`Vite: ${viteVersion}`);
        } catch (error) {
          this.logWarn('Vite is not available (may need to install frontend dependencies)');
        }
      } else {
        this.logFail('frontend/vite.config.js not found');
      }
    } catch (error) {
      this.logFail('Failed to check Vite configuration');
    }
  }

  checkDatabase() {
    this.logInfo('Checking database setup...');
    
    const schemaPath = path.join(this.projectDir, 'database', 'schema.sql');
    const setupPath = path.join(this.projectDir, 'database', 'setup.js');
    
    if (fs.existsSync(schemaPath)) {
      this.logPass('Database schema file found');
    } else {
      this.logFail('database/schema.sql not found');
    }
    
    if (fs.existsSync(setupPath)) {
      this.logPass('Database setup script found');
    } else {
      this.logFail('database/setup.js not found');
    }
    
    // Check if database file exists
    const dbPath = path.join(this.projectDir, 'database', 'mobius_ledger.db');
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      this.logPass(`Database file exists (${size} MB)`);
    } else {
      this.logWarn('Database file not found - run node setup.js to create it');
    }
  }

  // Run all checks
  runAllChecks() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║     Mobius Ledger v2 - Termux Compatibility Verification        ║');
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
    
    // Environment detection
    if (this.isTermux) {
      console.log(`${colors.bgYellow}${colors.black} TERMUX ENVIRONMENT DETECTED ${colors.reset}\n`);
    }
    
    // System checks
    console.log(`${colors.bright}=== System Requirements ===${colors.reset}\n`);
    this.checkNodeVersion();
    this.checkNpmVersion();
    this.checkGit();
    this.checkPython();
    this.checkGcc();
    this.checkMake();
    this.checkSqlite();
    if (this.isAndroid) this.checkAndroidNdk();
    
    console.log('\n');
    console.log(`${colors.bright}=== Project Structure ===${colors.reset}\n`);
    this.checkProjectStructure();
    
    console.log('\n');
    console.log(`${colors.bright}=== Dependencies ===${colors.reset}\n`);
    this.checkBackendDependencies();
    this.checkFrontendDependencies();
    
    console.log('\n');
    console.log(`${colors.bright}=== Deployment ===${colors.reset}\n`);
    this.checkDeploymentScripts();
    this.checkViteBuild();
    this.checkDatabase();
    
    console.log('\n');
    console.log(`${colors.bright}=== Mobile Compatibility ===${colors.reset}\n`);
    this.checkMobileResponsiveness();
    
    console.log('\n');
    console.log(`${colors.bright}=== Termux-Specific Checks ===${colors.reset}\n`);
    this.checkTermuxWorkarounds();
    
    // Print summary
    this.printSummary();
  }

  printSummary() {
    console.log('\n');
    console.log('╔════════════════════════════════════════════════════════════════╗');
    console.log('║                        SUMMARY                                   ║');
    console.log('╠════════════════════════════════════════════════════════════════╣\n');
    
    const total = this.results.passed.length + this.results.failed.length + this.results.warnings.length;
    
    console.log(`Total Checks: ${total}`);
    console.log(`${colors.green}✓ Passed: ${this.results.passed.length}${colors.reset}`);
    console.log(`${colors.red}✗ Failed: ${this.results.failed.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠ Warnings: ${this.results.warnings.length}${colors.reset}`);
    
    console.log('\n');
    
    // Overall compatibility assessment
    if (this.results.failed.length === 0 && this.results.warnings.length === 0) {
      console.log(`${colors.bgGreen}${colors.black} ✓ EXCELLENT - Full compatibility ${colors.reset}`);
      console.log('All features should work correctly in this environment.');
    } else if (this.results.failed.length === 0 && this.results.warnings.length <= 3) {
      console.log(`${colors.bgGreen}${colors.black} ✓ GOOD - Mostly compatible with minor limitations ${colors.reset}`);
      if (this.isTermux) {
        console.log('Backend database operations will not work due to native module compilation.');
        console.log('Frontend and all non-database features should work correctly.');
      }
    } else if (this.results.failed.length > 0) {
      console.log(`${colors.bgRed}${colors.white} ✗ LIMITED - Some critical features will not work ${colors.reset}`);
      console.log('Review the failed checks above for details.');
    }
    
    console.log('\n');
    
    if (this.results.failed.length > 0) {
      console.log(`${colors.bright}Failed Checks:${colors.reset}`);
      this.results.failed.forEach(fail => console.log(`  ${colors.red}✗${colors.reset} ${fail}`));
      console.log('');
    }
    
    if (this.results.warnings.length > 0) {
      console.log(`${colors.bright}Warnings:${colors.reset}`);
      this.results.warnings.forEach(warn => console.log(`  ${colors.yellow}⚠${colors.reset} ${warn}`));
      console.log('');
    }
    
    // Termux-specific recommendations
    if (this.isTermux) {
      console.log(`${colors.bright}Termux-Specific Recommendations:${colors.reset}`);
      console.log('');
      console.log('1. For development (frontend only):');
      console.log('   npm install --ignore-scripts');
      console.log('   npm run dev');
      console.log('');
      console.log('2. For backend (limited functionality):');
      console.log('   npm install --ignore-scripts');
      console.log('   node src/app.js');
      console.log('   Note: Database operations will fail');
      console.log('');
      console.log('3. For full functionality:');
      console.log('   Use a Linux/macOS/Windows environment');
      console.log('   Or install Android NDK and configure for Termux (complex)');
      console.log('');
    }
    
    console.log('╚════════════════════════════════════════════════════════════════╝\n');
  }
}

// Run the checker
const checker = new CompatibilityChecker();
checker.runAllChecks();
