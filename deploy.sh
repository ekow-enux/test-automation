#!/bin/bash

# =============================================================================
# Backend Deployment Script for EC2 Server
# =============================================================================
# This script handles the deployment of a Node.js backend application using:
# - Artifact extraction from ZIP file
# - PM2 process management
# - Proper file permissions and cleanup
# - Health checks and rollback capabilities
#
# Usage: ./deploy.sh [OPTIONS]
# Options:
#   -z, --zip-file PATH    Path to deployment ZIP artifact (required)
#   -p, --path PATH        Deployment path (default: /var/www/app)
#   -n, --name NAME        PM2 process name (default: node-app)
#   -p, --port PORT        Application port (default: 4000)
#   -r, --rollback         Enable rollback on failure
#   -v, --verbose          Enable verbose output
#   -h, --help             Show this help message
# =============================================================================

set -e  # Exit on any error

# Default configuration
DEPLOY_ZIP_FILE=""
DEPLOY_PATH="/var/www/app"
PM2_APP_NAME="node-app"
APP_PORT=4000
ENABLE_ROLLBACK=false
VERBOSE=false
BACKUP_RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_verbose() {
    if [ "$VERBOSE" = true ]; then
        echo -e "${BLUE}[VERBOSE]${NC} $1"
    fi
}

# Help function
show_help() {
    cat << EOF
Backend Deployment Script

USAGE:
    $0 [OPTIONS]

OPTIONS:
    -z, --zip-file PATH    Path to deployment ZIP artifact (required)
    -p, --path PATH        Deployment path (default: /var/www/app)
    -n, --name NAME        PM2 process name (default: node-app)
    -p, --port PORT        Application port (default: 4000)
    -r, --rollback         Enable rollback on failure
    -v, --verbose          Enable verbose output
    -h, --help             Show this help message

EXAMPLES:
    # Basic deployment
    $0 --zip-file /tmp/backend-deployment.zip

    # Deployment with custom options
    $0 --zip-file /tmp/backend-deployment.zip --path /var/www/app --name my-app --port 3000

    # Deployment with rollback enabled
    $0 --zip-file /tmp/backend-deployment.zip --rollback

EOF
}

# Parse command line arguments
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            -z|--zip-file)
                DEPLOY_ZIP_FILE="$2"
                shift 2
                ;;
            -p|--path)
                DEPLOY_PATH="$2"
                shift 2
                ;;
            -n|--name)
                PM2_APP_NAME="$2"
                shift 2
                ;;
            -o|--port)
                APP_PORT="$2"
                shift 2
                ;;
            -r|--rollback)
                ENABLE_ROLLBACK=true
                shift
                ;;
            -v|--verbose)
                VERBOSE=true
                shift
                ;;
            -h|--help)
                show_help
                exit 0
                ;;
            *)
                log_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done
}

# Validate prerequisites
validate_prerequisites() {
    log_info "Validating prerequisites..."
    
    # Check if running as correct user
    if [ "$EUID" -eq 0 ]; then
        log_warning "Running as root. Consider using a non-root user with sudo privileges."
    fi
    
    # Check if required commands are available
    local required_commands=("unzip" "npm" "pm2" "curl")
    for cmd in "${required_commands[@]}"; do
        if ! command -v "$cmd" &> /dev/null; then
            log_error "Required command '$cmd' not found. Please install it first."
            exit 1
        fi
    done
    
    # Check if deployment zip file exists
    if [ -z "$DEPLOY_ZIP_FILE" ]; then
        log_error "Deployment ZIP file path is required. Use -z or --zip-file option."
        exit 1
    fi
    
    if [ ! -f "$DEPLOY_ZIP_FILE" ]; then
        log_error "Deployment ZIP file not found: $DEPLOY_ZIP_FILE"
        exit 1
    fi
    
    log_success "Prerequisites validation completed"
}

# Create backup of current deployment
create_backup() {
    if [ ! -d "$DEPLOY_PATH" ] || [ -z "$(ls -A $DEPLOY_PATH 2>/dev/null)" ]; then
        log_info "No existing deployment to backup"
        return 0
    fi
    
    local backup_path="${DEPLOY_PATH}.backup.$(date +%Y%m%d_%H%M%S)"
    log_info "Creating backup of current deployment..."
    
    if sudo cp -r "$DEPLOY_PATH" "$backup_path"; then
        sudo chown -R $USER:$USER "$backup_path"
        log_success "Backup created: $backup_path"
        echo "$backup_path" > /tmp/deployment_backup_path
    else
        log_error "Failed to create backup"
        return 1
    fi
}

# Extract deployment artifact
extract_artifact() {
    local temp_path="/tmp/backend-deployment-$(date +%s)"
    log_info "Extracting deployment artifact to: $temp_path"
    
    mkdir -p "$temp_path"
    cd "$temp_path"
    
    if unzip -q "$DEPLOY_ZIP_FILE"; then
        log_success "Artifact extracted successfully"
    else
        log_error "Failed to extract artifact"
        return 1
    fi
    
    # Verify required files
    if [ ! -f "server.js" ]; then
        log_error "server.js not found in artifact"
        return 1
    fi
    
    if [ ! -f "package.json" ]; then
        log_error "package.json not found in artifact"
        return 1
    fi
    
    log_success "Artifact verification completed"
    echo "$temp_path" > /tmp/deployment_temp_path
}

# Stop existing PM2 process
stop_existing_process() {
    log_info "Stopping existing PM2 process: $PM2_APP_NAME"
    
    # Stop the process gracefully
    pm2 stop "$PM2_APP_NAME" 2>/dev/null || log_info "Process '$PM2_APP_NAME' not running or already stopped"
    
    # Delete the process if it exists
    pm2 delete "$PM2_APP_NAME" 2>/dev/null || log_info "Process '$PM2_APP_NAME' not found or already deleted"
    
    # Save PM2 state
    pm2 save
    
    log_success "Existing process stopped"
}

# Deploy new version
deploy_new_version() {
    local temp_path
    temp_path=$(cat /tmp/deployment_temp_path 2>/dev/null)
    
    if [ -z "$temp_path" ]; then
        log_error "Deployment temp path not found"
        return 1
    fi
    
    log_info "Deploying new version to: $DEPLOY_PATH"
    
    # Create deployment directory if it doesn't exist
    sudo mkdir -p "$DEPLOY_PATH"
    sudo chown $USER:$USER "$DEPLOY_PATH"
    
    # Clean deployment directory
    sudo rm -rf "$DEPLOY_PATH"/*
    
    # Copy new files
    sudo cp -r "$temp_path"/* "$DEPLOY_PATH/"
    sudo chown -R $USER:$USER "$DEPLOY_PATH"
    
    cd "$DEPLOY_PATH"
    
    # Verify deployment
    if [ ! -f "server.js" ]; then
        log_error "server.js not found after deployment"
        return 1
    fi
    
    log_success "New version deployed successfully"
}

# Install dependencies
install_dependencies() {
    cd "$DEPLOY_PATH"
    log_info "Installing production dependencies..."
    
    # Clean install for production
    if npm ci --omit=dev; then
        log_success "Dependencies installed successfully"
    else
        log_error "Failed to install dependencies"
        return 1
    fi
}

# Start application with PM2
start_application() {
    cd "$DEPLOY_PATH"
    log_info "Starting application with PM2..."
    
    # Start the application
    if pm2 start server.js --name "$PM2_APP_NAME"; then
        pm2 save
        log_success "Application started successfully"
    else
        log_error "Failed to start application"
        return 1
    fi
    
    # Wait a moment for the application to start
    sleep 3
}

# Health check
health_check() {
    log_info "Running health check..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        log_verbose "Health check attempt $attempt/$max_attempts"
        
        if curl -f -s "http://localhost:$APP_PORT/api/health" > /dev/null 2>&1; then
            log_success "Health check passed"
            return 0
        fi
        
        if [ $attempt -eq $max_attempts ]; then
            log_warning "Health check failed after $max_attempts attempts"
            return 1
        fi
        
        sleep 2
        ((attempt++))
    done
}

# Cleanup temporary files
cleanup() {
    log_info "Cleaning up temporary files..."
    
    # Remove temp extraction directory
    local temp_path
    temp_path=$(cat /tmp/deployment_temp_path 2>/dev/null)
    if [ -n "$temp_path" ] && [ -d "$temp_path" ]; then
        rm -rf "$temp_path"
        log_verbose "Removed temp directory: $temp_path"
    fi
    
    # Remove temp files
    rm -f /tmp/deployment_temp_path /tmp/deployment_backup_path
    
    # Clean old backups (keep only recent ones)
    if [ "$ENABLE_ROLLBACK" = true ]; then
        find "${DEPLOY_PATH}.backup"* -type d -mtime +$BACKUP_RETENTION_DAYS -exec rm -rf {} + 2>/dev/null || true
    fi
    
    log_success "Cleanup completed"
}

# Rollback function
rollback_deployment() {
    if [ "$ENABLE_ROLLBACK" = false ]; then
        log_warning "Rollback not enabled, skipping..."
        return 0
    fi
    
    local backup_path
    backup_path=$(cat /tmp/deployment_backup_path 2>/dev/null)
    
    if [ -z "$backup_path" ] || [ ! -d "$backup_path" ]; then
        log_error "No backup found for rollback"
        return 1
    fi
    
    log_warning "Rolling back to previous version..."
    
    # Stop current process
    stop_existing_process
    
    # Restore backup
    sudo rm -rf "$DEPLOY_PATH"/*
    sudo cp -r "$backup_path"/* "$DEPLOY_PATH/"
    sudo chown -R $USER:$USER "$DEPLOY_PATH"
    
    # Restart application
    install_dependencies
    start_application
    
    log_success "Rollback completed"
}

# Main deployment function
main_deployment() {
    log_info "Starting deployment process..."
    log_info "Deployment configuration:"
    log_info "  - ZIP file: $DEPLOY_ZIP_FILE"
    log_info "  - Deploy path: $DEPLOY_PATH"
    log_info "  - PM2 name: $PM2_APP_NAME"
    log_info "  - Port: $APP_PORT"
    log_info "  - Rollback enabled: $ENABLE_ROLLBACK"
    
    # Set trap for cleanup and rollback
    trap 'cleanup; if [ "$ENABLE_ROLLBACK" = true ]; then rollback_deployment; fi' ERR
    
    # Execute deployment steps
    validate_prerequisites
    create_backup
    extract_artifact
    stop_existing_process
    deploy_new_version
    install_dependencies
    start_application
    
    # Health check
    if health_check; then
        log_success "Deployment completed successfully!"
        
        # Print deployment summary
        echo ""
        echo "=== DEPLOYMENT SUMMARY ==="
        echo "✅ Deployment path: $DEPLOY_PATH"
        echo "🚀 PM2 process: $PM2_APP_NAME"
        echo "📋 Port: $APP_PORT"
        echo "🌐 Health check: http://localhost:$APP_PORT/api/health"
        echo ""
        echo "Useful commands:"
        echo "  - Check status: pm2 status"
        echo "  - View logs: pm2 logs $PM2_APP_NAME"
        echo "  - Restart: pm2 restart $PM2_APP_NAME"
        echo "  - Stop: pm2 stop $PM2_APP_NAME"
        
    else
        log_error "Health check failed"
        if [ "$ENABLE_ROLLBACK" = true ]; then
            rollback_deployment
        fi
        exit 1
    fi
    
    # Cleanup
    cleanup
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    parse_arguments "$@"
    main_deployment
fi