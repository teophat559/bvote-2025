k#!/bin/bash

# ===============================================
# VPS Maintenance & Monitoring Script
# ===============================================
#
# This script provides maintenance and monitoring utilities
# for the social media automation system on VPS.
#
# Usage: ./deployment/vps-maintenance.sh [command] [server_ip] [username]
# Commands: status, logs, restart, update, backup, monitor
#
# ===============================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
COMMAND="${1:-status}"
VPS_IP="${2:-your-vps-ip}"
VPS_USER="${3:-root}"
PROJECT_NAME="social-media-automation"

# Print functions
print_status() { echo -e "${BLUE}[INFO]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Check system status
check_status() {
    print_status "Checking system status on $VPS_IP..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "🖥️  System Information:"
        echo "   OS: $(lsb_release -d | cut -f2)"
        echo "   Uptime: $(uptime -p)"
        echo "   Load: $(uptime | awk -F'load average:' '{print $2}')"
        echo "   Memory: $(free -h | grep ^Mem | awk '{print $3"/"$2}')"
        echo "   Disk: $(df -h / | tail -1 | awk '{print $3"/"$2" ("$5" used)"}')"
        echo ""

        echo "🔧 Service Status:"
        systemctl is-active nginx && echo "   ✅ Nginx: Running" || echo "   ❌ Nginx: Stopped"
        systemctl is-active mysql && echo "   ✅ MySQL: Running" || echo "   ❌ MySQL: Stopped"

        echo ""
        echo "🚀 PM2 Application Status:"
        sudo -u automation pm2 status

        echo ""
        echo "🌐 Network Status:"
        netstat -tlnp | grep -E ':80|:443|:3000' | head -5

        echo ""
        echo "💾 Disk Usage - Application:"
        du -sh /opt/social-automation/current 2>/dev/null || echo "   Application not found"
        du -sh /var/lib/social-automation 2>/dev/null || echo "   Data directory not found"
        du -sh /var/log/social-automation 2>/dev/null || echo "   Log directory not found"
EOF
}

# View application logs
view_logs() {
    print_status "Viewing application logs..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "📊 Recent Backend Logs (last 50 lines):"
        echo "========================================"
        tail -n 50 /var/log/social-automation/backend-combined.log 2>/dev/null || echo "No backend logs found"

        echo ""
        echo "🤖 Recent Worker Logs (last 30 lines):"
        echo "======================================"
        tail -n 30 /var/log/social-automation/worker-combined.log 2>/dev/null || echo "No worker logs found"

        echo ""
        echo "⚠️  Recent Error Logs (last 20 lines):"
        echo "====================================="
        tail -n 20 /var/log/social-automation/backend-error.log 2>/dev/null || echo "No error logs found"

        echo ""
        echo "📈 PM2 Process Monitoring:"
        sudo -u automation pm2 monit --no-interaction || true
EOF
}

# Restart services
restart_services() {
    print_status "Restarting services..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "🔄 Restarting PM2 applications..."
        sudo -u automation pm2 restart all

        echo "🔄 Restarting Nginx..."
        systemctl restart nginx

        echo "🔄 Checking service status..."
        sleep 5
        sudo -u automation pm2 status
        systemctl status nginx --no-pager -l

        echo "✅ Services restarted successfully"
EOF

    print_success "Services restarted"
}

# Update application
update_application() {
    print_status "Updating application..."

    # Create new deployment package
    print_status "Creating update package..."
    tar -czf /tmp/social-automation-update.tar.gz \
        --exclude=node_modules \
        --exclude=.git \
        --exclude=browser-profiles \
        --exclude=screenshots \
        --exclude=logs \
        --exclude=dist \
        --exclude=admin/node_modules \
        --exclude=user/node_modules \
        --exclude=backend/node_modules \
        .

    # Upload and deploy update
    scp /tmp/social-automation-update.tar.gz "$VPS_USER@$VPS_IP:/tmp/"

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation

        echo "🛑 Stopping applications..."
        sudo -u automation pm2 stop all

        echo "💾 Creating backup..."
        if [ -d "current" ]; then
            mv current backup-$(date +%Y%m%d-%H%M%S)
        fi

        echo "📦 Deploying update..."
        mkdir -p current
        cd current
        tar -xzf /tmp/social-automation-update.tar.gz

        # Copy environment file from backup
        if [ -f "../backup-*/env.production" ]; then
            cp ../backup-*/.env.production . 2>/dev/null || true
        fi

        echo "📚 Installing dependencies..."
        sudo -u automation npm install --production

        echo "🏗️  Building frontends..."
        cd admin && sudo -u automation npm install && sudo -u automation npm run build && cd ..
        cd user && sudo -u automation npm install && sudo -u automation npm run build && cd ..

        echo "🚀 Starting applications..."
        sudo -u automation pm2 start ecosystem.config.js

        # Set ownership
        chown -R automation:automation /opt/social-automation/current

        echo "✅ Update completed successfully"
EOF

    # Cleanup
    rm -f /tmp/social-automation-update.tar.gz

    print_success "Application updated successfully"
}

# Create backup
create_backup() {
    print_status "Creating system backup..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
        BACKUP_DIR="/opt/backups/social-automation-$BACKUP_DATE"

        echo "💾 Creating backup directory..."
        mkdir -p "$BACKUP_DIR"

        echo "📦 Backing up application files..."
        cp -r /opt/social-automation/current "$BACKUP_DIR/application"

        echo "💾 Backing up database..."
        mysqldump -u automation_user -p'AutomationPass123!' social_automation_db > "$BACKUP_DIR/database.sql"

        echo "📁 Backing up profiles and data..."
        cp -r /var/lib/social-automation "$BACKUP_DIR/data"

        echo "📊 Backing up logs..."
        cp -r /var/log/social-automation "$BACKUP_DIR/logs"

        echo "🗜️  Compressing backup..."
        cd /opt/backups
        tar -czf "social-automation-$BACKUP_DATE.tar.gz" "social-automation-$BACKUP_DATE"
        rm -rf "social-automation-$BACKUP_DATE"

        echo "🧹 Cleaning old backups (keeping last 7)..."
        ls -t /opt/backups/social-automation-*.tar.gz | tail -n +8 | xargs rm -f

        echo "✅ Backup created: /opt/backups/social-automation-$BACKUP_DATE.tar.gz"
EOF

    print_success "Backup created successfully"
}

# Monitor system resources
monitor_system() {
    print_status "Starting system monitoring..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "📊 Real-time System Monitoring"
        echo "=============================="
        echo "Press Ctrl+C to stop monitoring"
        echo ""

        while true; do
            clear
            echo "🕐 $(date)"
            echo "────────────────────────────────────────"

            echo "💻 System Resources:"
            echo "   CPU: $(top -bn1 | grep "Cpu(s)" | awk '{print $2}' | awk -F'%' '{print $1}')% used"
            echo "   Memory: $(free | grep Mem | awk '{printf "%.1f%%", $3/$2 * 100.0}')"
            echo "   Disk: $(df -h / | awk 'NR==2{printf "%s used", $5}')"
            echo "   Load: $(uptime | awk -F'load average:' '{print $2}')"

            echo ""
            echo "🚀 PM2 Applications:"
            sudo -u automation pm2 jlist | jq -r '.[] | "   \(.name): \(.pm2_env.status) (CPU: \(.monit.cpu)%, Mem: \(.monit.memory / 1024 / 1024 | floor)MB)"' 2>/dev/null || echo "   PM2 status unavailable"

            echo ""
            echo "🌐 Network Connections:"
            echo "   Active connections: $(netstat -an | grep ESTABLISHED | wc -l)"
            echo "   Listening ports: $(netstat -tln | grep LISTEN | wc -l)"

            echo ""
            echo "📊 Recent Activity (last 5 backend logs):"
            tail -n 5 /var/log/social-automation/backend-combined.log 2>/dev/null | sed 's/^/   /' || echo "   No recent activity"

            sleep 10
        done
EOF
}

# Performance optimization
optimize_performance() {
    print_status "Optimizing VPS performance..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        echo "⚡ Optimizing system performance..."

        # Optimize swappiness
        echo "vm.swappiness=10" >> /etc/sysctl.conf

        # Optimize network settings
        cat >> /etc/sysctl.conf << 'SYSCTL_EOF'
# Network optimizations
net.core.rmem_max = 16777216
net.core.wmem_max = 16777216
net.ipv4.tcp_rmem = 4096 87380 16777216
net.ipv4.tcp_wmem = 4096 65536 16777216
net.ipv4.tcp_congestion_control = bbr
SYSCTL_EOF

        # Apply settings
        sysctl -p

        # Optimize Nginx
        cat > /etc/nginx/conf.d/performance.conf << 'NGINX_PERF_EOF'
# Performance optimizations
worker_processes auto;
worker_connections 1024;
keepalive_timeout 65;
gzip on;
gzip_vary on;
gzip_min_length 1000;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
NGINX_PERF_EOF

        # Restart services to apply optimizations
        systemctl restart nginx

        echo "✅ Performance optimizations applied"
EOF

    print_success "Performance optimization complete"
}

# Setup monitoring and alerts
setup_monitoring() {
    print_status "Setting up monitoring and alerts..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Create monitoring script
        cat > /usr/local/bin/social-automation-monitor.sh << 'MONITOR_EOF'
#!/bin/bash

# Health check script
LOG_FILE="/var/log/social-automation/health-check.log"
DATE=$(date)

echo "[$DATE] Starting health check..." >> "$LOG_FILE"

# Check PM2 processes
PM2_STATUS=$(sudo -u automation pm2 jlist | jq -r '.[] | select(.pm2_env.status != "online") | .name' 2>/dev/null)
if [ ! -z "$PM2_STATUS" ]; then
    echo "[$DATE] WARNING: PM2 processes not running: $PM2_STATUS" >> "$LOG_FILE"
    # Auto-restart failed processes
    sudo -u automation pm2 restart "$PM2_STATUS"
fi

# Check disk space
DISK_USAGE=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    echo "[$DATE] WARNING: Disk usage high: ${DISK_USAGE}%" >> "$LOG_FILE"
fi

# Check memory usage
MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
if [ "$MEM_USAGE" -gt 90 ]; then
    echo "[$DATE] WARNING: Memory usage high: ${MEM_USAGE}%" >> "$LOG_FILE"
fi

# Check application response
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/health 2>/dev/null || echo "000")
if [ "$HTTP_STATUS" != "200" ]; then
    echo "[$DATE] ERROR: Application not responding (HTTP: $HTTP_STATUS)" >> "$LOG_FILE"
    # Try to restart application
    sudo -u automation pm2 restart social-automation-backend
fi

echo "[$DATE] Health check completed" >> "$LOG_FILE"
MONITOR_EOF

        chmod +x /usr/local/bin/social-automation-monitor.sh

        # Setup cron job for monitoring
        echo "*/5 * * * * /usr/local/bin/social-automation-monitor.sh" | crontab -

        # Setup log rotation
        cat > /etc/logrotate.d/social-automation << 'LOGROTATE_EOF'
/var/log/social-automation/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    sharedscripts
    postrotate
        sudo -u automation pm2 reloadLogs
    endscript
}
LOGROTATE_EOF

        echo "✅ Monitoring and alerts configured"
EOF

    print_success "Monitoring setup complete"
}

# Show help
show_help() {
    echo "🛠️  VPS Maintenance Script for Social Media Automation"
    echo "====================================================="
    echo ""
    echo "Usage: $0 [command] [vps_ip] [username]"
    echo ""
    echo "Commands:"
    echo "  status     - Check system and application status"
    echo "  logs       - View application logs"
    echo "  restart    - Restart all services"
    echo "  update     - Update application to latest version"
    echo "  backup     - Create full system backup"
    echo "  monitor    - Start real-time monitoring"
    echo "  optimize   - Apply performance optimizations"
    echo "  setup-monitoring - Setup automated monitoring"
    echo "  help       - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 status 192.168.1.100 root"
    echo "  $0 logs your-server.com ubuntu"
    echo "  $0 restart 10.0.0.5 admin"
    echo ""
    echo "📋 Requirements:"
    echo "  - SSH access to VPS"
    echo "  - Application deployed with vps-deploy.sh"
    echo "  - PM2 and system services running"
}

# Main function
main() {
    case "$COMMAND" in
        "status")
            check_status
            ;;
        "logs")
            view_logs
            ;;
        "restart")
            restart_services
            ;;
        "update")
            update_application
            ;;
        "backup")
            create_backup
            ;;
        "monitor")
            monitor_system
            ;;
        "optimize")
            optimize_performance
            ;;
        "setup-monitoring")
            setup_monitoring
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            print_error "Unknown command: $COMMAND"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Validate inputs
if [ "$VPS_IP" = "your-vps-ip" ] && [ "$COMMAND" != "help" ]; then
    print_error "Please provide VPS IP address"
    echo ""
    show_help
    exit 1
fi

# Run main function
main "$@"
