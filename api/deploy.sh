#!/bin/bash

# Deployment script for API application
# This script should be placed on the EC2 instance at the deployment path

set -e  # Exit on any error

echo "=== Starting deployment script ==="
echo "Current directory: $(pwd)"
echo "User: $(whoami)"
echo "Time: $(date)"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found in current directory: $(pwd)"
    exit 1
fi

print_status "Found package.json"

# Create .env file if environment variables are provided
if [ -n "$NODE_ENV" ] || [ -n "$PORT" ]; then
    print_status "Creating .env file"
    cat > .env <<EOL
NODE_ENV=${NODE_ENV:-production}
PORT=${PORT:-4000}
EOL
    print_status ".env file created"
else
    print_warning "Environment variables not provided, skipping .env creation"
fi

# Install PM2 globally if not already installed
if ! command -v pm2 &> /dev/null; then
    print_status "Installing PM2 globally"
    npm install -g pm2
else
    print_status "PM2 already installed"
fi

# Install production dependencies
print_status "Installing production dependencies"
if [ -f "package-lock.json" ]; then
    npm ci --omit=dev
else
    npm install --omit=dev
fi
print_status "Dependencies installed"

# Create ecosystem.config.js if it doesn't exist
if [ ! -f "ecosystem.config.js" ]; then
    print_status "Creating ecosystem.config.js"
    cat > ecosystem.config.js <<'ECOSYSTEM'
module.exports = {
  apps: [{
    name: 'api-app',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development',
      PORT: 4000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 4000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    restart_delay: 4000,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
ECOSYSTEM
    print_status "ecosystem.config.js created"
else
    print_status "ecosystem.config.js already exists"
fi

# Create logs directory if it doesn't exist
mkdir -p logs

# Stop existing PM2 process if running
print_status "Stopping existing PM2 processes"
pm2 delete api-app 2>/dev/null || true

# Start the application with PM2
print_status "Starting application with PM2"
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Optional: Setup PM2 to start on system reboot
print_status "Setting up PM2 startup script"
pm2 startup | tail -1 | bash 2>/dev/null || print_warning "PM2 startup setup failed (may need manual setup)"

# Reload nginx if it's installed and running
if command -v nginx &> /dev/null; then
    print_status "Reloading nginx"
    sudo systemctl reload nginx 2>/dev/null || print_warning "nginx reload failed or not needed"
fi

# Health check
print_status "Running health check"
sleep 5  # Wait for app to start

if curl -f http://localhost:${PORT:-4000}/api/health >/dev/null 2>&1; then
    print_status "Health check passed"
else
    print_warning "Health check failed - manual verification needed"
fi

# Cleanup old deployment if it exists
if [ -d "../previous" ]; then
    print_status "Cleaning up previous deployment"
    rm -rf ../previous
fi

print_status "Deployment completed successfully!"
echo "=== Application is now running ==="
echo "PM2 Status:"
pm2 status
echo ""
echo "Application logs:"
pm2 logs api-app --lines 10 --nostream