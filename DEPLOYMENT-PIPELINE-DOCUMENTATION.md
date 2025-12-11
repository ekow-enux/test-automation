# Complete Backend Deployment Pipeline Documentation

This document provides a comprehensive explanation of the end-to-end deployment pipeline for your Node.js backend application, from code commit to live production deployment.

## Overview

The deployment pipeline is a **CI/CD (Continuous Integration/Continuous Deployment)** system that automatically builds, tests, and deploys your backend application to an EC2 server whenever code is pushed to the main branch. The pipeline uses **GitHub Actions** for automation, **SCP** for secure file transfer, and **PM2** for process management.

## Architecture Overview

```
┌─────────────┐    ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
│   GitHub    │    │   GitHub     │    │    SCP      │    │    EC2      │
│ Repository  │───▶│   Actions    │───▶│  Transfer   │───▶│   Server    │
│   (Code)    │    │ (CI/CD)      │    │   (ZIP)     │    │ (Production)│
└─────────────┘    └──────────────┘    └─────────────┘    └─────────────┘
                           │                   │                   │
                           ▼                   ▼                   ▼
                   ┌──────────────┐    ┌─────────────┐    ┌─────────────┐
                   │   Artifact   │    │ deploy.sh   │    │   PM2       │
                   │   (.zip)     │    │   Script    │    │  Process    │
                   └──────────────┘    └─────────────┘    └─────────────┘
```

## Pipeline Components

### 1. GitHub Actions Workflow (`.github/workflows/backend-deployment.yml`)
The CI/CD configuration that automates the entire deployment process.

### 2. Deployment Script (`deploy.sh`)
A robust shell script that handles the actual deployment on the EC2 server.

### 3. EC2 Server Configuration
The target server setup with proper permissions and dependencies.

### 4. PM2 Process Manager
Handles application lifecycle management (start, stop, restart, monitoring).

## Detailed Pipeline Flow

### Phase 1: Code Commit and Trigger
```
Developer pushes code → GitHub detects change → Workflow triggers
```

**Trigger Conditions:**
- Push to `main` branch
- Pull request to `main` branch
- Manual workflow dispatch

### Phase 2: Testing Phase (GitHub Actions)
```
Checkout Code → Setup Node.js → Install Dependencies → Run Tests
```

**Jobs Executed:**
1. **test-backend**: Runs Jest unit tests
2. **test-results**: Uploads test coverage reports

**Key Features:**
- Uses Node.js 20.x
- Caches npm dependencies for faster builds
- Uploads test artifacts for analysis

### Phase 3: Build and Package Phase
```
Install Dependencies → Create Deployment Package → Create ZIP Artifact
```

**Build Process:**
1. Copies backend directory contents
2. Moves `src/server.js` to `server.js` (as required)
3. Removes test files and unnecessary content
4. Creates a clean deployment ZIP artifact
5. Uploads artifact for deployment

**Artifact Contents:**
- `server.js` (main entry point)
- `package.json` (dependencies)
- All application source code
- Environment configuration files

### Phase 4: Deployment Phase (Main Branch Only)
```
Download Artifact → Setup SSH → Transfer via SCP → Execute deploy.sh
```

**Deployment Steps:**

#### 4.1 SSH Setup
- Uses SSH agent forwarding with repository secrets
- **NO modification to `~/.ssh/authorized_keys`** (as requested)
- Establishes secure connection to EC2 server

#### 4.2 File Transfer via SCP
- Transfers ZIP artifact to `/tmp/` on EC2 server
- Uses secure copy protocol (SCP) instead of rsync
- Verifies transfer completion

#### 4.3 Server-Side Deployment
The deployment script executes the following steps:

##### Step 1: Prerequisites Validation
```bash
# Validates:
- Required commands (unzip, npm, pm2, curl)
- Deployment ZIP file existence
- User permissions
```

##### Step 2: Backup Creation
```bash
# Creates timestamped backup:
/var/www/app.backup.20231211_231530
```

##### Step 3: Artifact Extraction
```bash
# Extracts to temporary location:
/tmp/backend-deployment-1234567890/
```

##### Step 4: Process Management
```bash
# Stops existing PM2 process:
pm2 stop node-app
pm2 delete node-app
```

##### Step 5: Deployment
```bash
# Cleans and deploys new version:
sudo rm -rf /var/www/app/*
sudo cp -r /tmp/extracted/* /var/www/app/
sudo chown -R ubuntu:ubuntu /var/www/app/
```

##### Step 6: Dependencies Installation
```bash
# Installs production dependencies:
npm ci --omit=dev
```

##### Step 7: Application Start
```bash
# Starts application with PM2:
pm2 start server.js --name node-app
pm2 save
```

##### Step 8: Health Check
```bash
# Verifies application health:
curl -f http://localhost:4000/api/health
```

##### Step 9: Cleanup
```bash
# Removes temporary files:
rm -rf /tmp/backend-deployment-*
rm -f /tmp/backend-deployment.zip
```

### Phase 5: Verification and Monitoring
```
PM2 Status → Application Logs → Health Check → External Verification
```

**Verification Steps:**
1. **Internal Health Check**: Verifies localhost endpoint
2. **PM2 Status**: Confirms process is running
3. **Log Review**: Checks application startup logs
4. **External Health Check**: Tests public domain endpoint

## Configuration Details

### Environment Variables
**GitHub Repository Secrets:**
- `SSH_KEY`: Private SSH key for EC2 access
- `SSH_USER`: SSH username (e.g., 'ubuntu')
- `SSH_HOST`: EC2 public IP or domain

**Application Environment:**
- `NODE_ENV`: production
- `PORT`: 4000
- Additional secrets as needed

### File Locations
**On EC2 Server:**
- **Application Directory**: `/var/www/app`
- **PM2 Process Name**: `node-app`
- **Application Port**: `4000`
- **Domain**: `server.ekowlabs.space`
- **Health Endpoint**: `https://server.ekowlabs.space/api/health`

**Temporary Locations:**
- **Artifact Storage**: `/tmp/backend-deployment.zip`
- **Extraction Directory**: `/tmp/backend-deployment-{timestamp}`
- **Backups**: `/var/www/app.backup.{timestamp}`

### Process Management
**PM2 Configuration:**
```javascript
// Auto-generated ecosystem.config.js
module.exports = {
  apps: [{
    name: 'node-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 4000
    }
  }]
};
```

## Error Handling and Rollback

### Automatic Rollback
If deployment fails, the system:
1. **Detects failure** during health check
2. **Restores backup** from previous deployment
3. **Restarts application** with previous version
4. **Reports failure** in GitHub Actions

### Manual Rollback
```bash
# Use backup directly:
sudo cp -r /var/www/app.backup.20231211_231530/* /var/www/app/
pm2 restart node-app
```

### Recovery Procedures
**Common Failure Scenarios:**

1. **Health Check Failure**
   - Check PM2 logs: `pm2 logs node-app`
   - Verify dependencies: `npm ci`
   - Check port availability: `netstat -tlnp | grep :4000`

2. **Permission Issues**
   ```bash
   sudo chown -R ubuntu:ubuntu /var/www/app
   sudo chmod -R 755 /var/www/app
   ```

3. **SSH Connection Issues**
   - Verify SSH key in GitHub secrets
   - Check EC2 security group rules
   - Confirm SSH agent forwarding

## Monitoring and Maintenance

### PM2 Commands
```bash
# Check application status
pm2 status

# View real-time logs
pm2 logs node-app

# Restart application
pm2 restart node-app

# Stop application
pm2 stop node-app

# Monitor resources
pm2 monit
```

### Log Locations
- **Application Logs**: `/var/log/app/node-app*.log`
- **PM2 Logs**: `pm2 logs node-app`
- **System Logs**: `/var/log/syslog`

### Health Monitoring
**Endpoints to Monitor:**
- `https://server.ekowlabs.space/api/health` - Application health
- `http://localhost:4000/api/health` - Internal health check

## Security Considerations

### SSH Security
- **No authorized_keys modification** (as requested)
- SSH agent forwarding from GitHub Actions
- Key-based authentication only
- Proper file permissions on SSH keys

### File Security
- Application files owned by non-root user
- Environment variables in protected `.env` file
- Secure file permissions (644 for files, 755 for directories)

### Network Security
- Firewall rules restrict access to necessary ports
- HTTPS redirect for web traffic
- Security headers in Nginx configuration

## Performance Optimization

### Build Optimization
- **Dependency Caching**: npm packages cached between builds
- **Artifact Retention**: Deployment artifacts kept for 7 days
- **Parallel Execution**: Multiple jobs run concurrently where possible

### Runtime Optimization
- **PM2 Clustering**: Uses all available CPU cores
- **Process Management**: Automatic restart on failures
- **Log Rotation**: Automatic log file management

## Troubleshooting Guide

### Common Issues

1. **Deployment Fails at Testing Phase**
   - Check test files for syntax errors
   - Verify all dependencies are properly declared
   - Review Jest configuration

2. **Artifact Creation Fails**
   - Ensure backend directory structure is correct
   - Check for sufficient disk space
   - Verify file permissions

3. **SCP Transfer Fails**
   - Verify SSH credentials in GitHub secrets
   - Check EC2 security group allows SSH
   - Confirm SCP is available on EC2

4. **Deployment Script Fails**
   - Check EC2 server has required software (npm, pm2, unzip)
   - Verify user permissions for /var/www/app
   - Review deployment script logs in GitHub Actions

### Debug Commands

```bash
# On EC2 Server - Check PM2 status
pm2 status

# On EC2 Server - View application logs
pm2 logs node-app --lines 50

# On EC2 Server - Check disk space
df -h

# On EC2 Server - Check process port
netstat -tlnp | grep :4000

# On GitHub Actions - Download deployment logs
# Available in the Actions tab for failed workflows
```

## Deployment Timeline

**Typical Deployment Duration:**
1. **Testing Phase**: 2-3 minutes
2. **Build Phase**: 1-2 minutes
3. **Transfer Phase**: 30-60 seconds
4. **Deployment Phase**: 2-5 minutes
5. **Total Time**: 6-11 minutes

**Factors Affecting Duration:**
- Number and size of dependencies
- Network speed between GitHub and EC2
- Server load and available resources
- Application startup time

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Update Dependencies**: Review and update npm packages monthly
2. **Monitor Logs**: Check application and system logs weekly
3. **Update System**: Keep Ubuntu packages updated
4. **Review Backups**: Clean up old backup directories
5. **Security Updates**: Apply security patches promptly

### Pipeline Updates
To update the deployment pipeline:
1. Modify `.github/workflows/backend-deployment.yml`
2. Test changes on a feature branch
3. Merge to main after approval
4. Monitor the next deployment

## Conclusion

This deployment pipeline provides a robust, automated, and secure way to deploy your Node.js backend application to production. The pipeline handles everything from code testing to live deployment, with built-in error handling, rollback capabilities, and comprehensive monitoring.

**Key Benefits:**
- **Automated**: Zero-touch deployment from code commit to production
- **Secure**: SSH-based deployment with no SSH key modifications
- **Reliable**: Built-in testing, backup, and rollback mechanisms
- **Scalable**: PM2 clustering and proper process management
- **Monitored**: Comprehensive logging and health checking

For additional support or customization, refer to the individual component documentation or troubleshoot using the provided debugging commands.