#!/bin/bash

# BVOTE Backend Deployment Script
# Production deployment with zero downtime

set -e

echo "🚀 Starting BVOTE Backend Deployment..."

# Configuration
PROJECT_NAME="bvote-backend"
DOCKER_IMAGE="bvote/backend"
CONTAINER_NAME="bvote-backend"
BACKUP_DIR="./backups"
LOG_FILE="./logs/deployment.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warn() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
if [[ $EUID -eq 0 ]]; then
   error "This script should not be run as root for security reasons"
fi

# Check dependencies
check_dependencies() {
    log "Checking dependencies..."

    command -v docker >/dev/null 2>&1 || error "Docker is not installed"
    command -v docker-compose >/dev/null 2>&1 || error "Docker Compose is not installed"
    command -v git >/dev/null 2>&1 || error "Git is not installed"

    log "✅ All dependencies are installed"
}

# Create necessary directories
setup_directories() {
    log "Setting up directories..."

    mkdir -p "$BACKUP_DIR"
    mkdir -p "./logs"
    mkdir -p "./data"
    mkdir -p "./uploads"
    mkdir -p "./chrome-profiles"
    mkdir -p "./nginx/ssl"

    log "✅ Directories created"
}

# Backup current data
backup_data() {
    log "Creating backup..."

    BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"

    mkdir -p "$BACKUP_PATH"

    # Backup database
    if [ -f "./data/bvote.db" ]; then
        cp "./data/bvote.db" "$BACKUP_PATH/"
        log "✅ Database backed up"
    fi

    # Backup uploads
    if [ -d "./uploads" ]; then
        cp -r "./uploads" "$BACKUP_PATH/"
        log "✅ Uploads backed up"
    fi

    # Backup logs
    if [ -d "./logs" ]; then
        cp -r "./logs" "$BACKUP_PATH/"
        log "✅ Logs backed up"
    fi

    log "✅ Backup completed: $BACKUP_PATH"
}

# Pull latest code
update_code() {
    log "Updating code..."

    # Check if git repo exists
    if [ -d ".git" ]; then
        git fetch origin
        git pull origin main
        log "✅ Code updated from Git"
    else
        warn "Not a Git repository, skipping code update"
    fi
}

# Build Docker image
build_image() {
    log "Building Docker image..."

    docker build -t "$DOCKER_IMAGE:latest" .

    # Tag with timestamp
    TIMESTAMP=$(date +%Y%m%d-%H%M%S)
    docker tag "$DOCKER_IMAGE:latest" "$DOCKER_IMAGE:$TIMESTAMP"

    log "✅ Docker image built: $DOCKER_IMAGE:latest"
}

# Health check function
health_check() {
    local max_attempts=30
    local attempt=1

    log "Performing health check..."

    while [ $attempt -le $max_attempts ]; do
        if curl -f -s http://localhost:3000/health > /dev/null 2>&1; then
            log "✅ Health check passed"
            return 0
        fi

        log "Health check attempt $attempt/$max_attempts failed, retrying in 5 seconds..."
        sleep 5
        ((attempt++))
    done

    error "Health check failed after $max_attempts attempts"
}

# Deploy with zero downtime
deploy() {
    log "Starting deployment..."

    # Check if container is running
    if docker ps | grep -q "$CONTAINER_NAME"; then
        log "Stopping existing container..."
        docker-compose down --timeout 30
    fi

    # Start new containers
    log "Starting new containers..."
    docker-compose up -d

    # Wait for services to be ready
    sleep 10

    # Health check
    health_check

    log "✅ Deployment completed successfully"
}

# Cleanup old images
cleanup() {
    log "Cleaning up old images..."

    # Remove dangling images
    docker image prune -f

    # Keep only last 5 images
    docker images "$DOCKER_IMAGE" --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    tail -n +2 | sort -k2 -r | tail -n +6 | awk '{print $1}' | xargs -r docker rmi

    log "✅ Cleanup completed"
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."

    # Stop current containers
    docker-compose down --timeout 30

    # Get previous image
    PREVIOUS_IMAGE=$(docker images "$DOCKER_IMAGE" --format "{{.Tag}}" | grep -v latest | head -n 1)

    if [ -n "$PREVIOUS_IMAGE" ]; then
        # Tag previous image as latest
        docker tag "$DOCKER_IMAGE:$PREVIOUS_IMAGE" "$DOCKER_IMAGE:latest"

        # Start with previous image
        docker-compose up -d

        # Health check
        health_check

        log "✅ Rollback completed to version: $PREVIOUS_IMAGE"
    else
        error "No previous version found for rollback"
    fi
}

# Main deployment process
main() {
    log "🚀 BVOTE Backend Deployment Started"

    # Parse command line arguments
    case "${1:-deploy}" in
        "deploy")
            check_dependencies
            setup_directories
            backup_data
            update_code
            build_image
            deploy
            cleanup
            log "🎉 Deployment completed successfully!"
            ;;
        "rollback")
            rollback
            log "🔄 Rollback completed!"
            ;;
        "health")
            health_check
            ;;
        "backup")
            backup_data
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|health|backup|cleanup}"
            echo ""
            echo "Commands:"
            echo "  deploy   - Full deployment (default)"
            echo "  rollback - Rollback to previous version"
            echo "  health   - Run health check"
            echo "  backup   - Create backup only"
            echo "  cleanup  - Cleanup old images"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
