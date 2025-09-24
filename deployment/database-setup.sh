#!/bin/bash

# ===============================================
# Database Setup Script for Social Media Automation
# ===============================================
#
# This script sets up and configures the database
# for the social media automation system.
#
# Usage: ./deployment/database-setup.sh [server_ip] [username]
#
# ===============================================

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

VPS_IP="${1:-your-vps-ip}"
VPS_USER="${2:-root}"

print_status() { echo -e "${BLUE}[DATABASE]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# Generate secure passwords
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-16
}

# Install and configure MySQL
install_mysql() {
    print_status "Installing and configuring MySQL..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Install MySQL Server
        apt update
        apt install -y mysql-server mysql-client

        # Start MySQL service
        systemctl start mysql
        systemctl enable mysql

        echo "✅ MySQL installed and started"
EOF

    print_success "MySQL installation complete"
}

# Secure MySQL installation
secure_mysql() {
    print_status "Securing MySQL installation..."

    # Generate passwords
    ROOT_PASSWORD=$(generate_password)
    APP_PASSWORD=$(generate_password)

    ssh "$VPS_USER@$VPS_IP" << EOF
        # Secure MySQL installation
        mysql << 'MYSQL_SECURE_EOF'
            -- Set root password
            ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${ROOT_PASSWORD}';

            -- Remove anonymous users
            DELETE FROM mysql.user WHERE User='';

            -- Remove remote root access
            DELETE FROM mysql.user WHERE User='root' AND Host NOT IN ('localhost', '127.0.0.1', '::1');

            -- Remove test database
            DROP DATABASE IF EXISTS test;
            DELETE FROM mysql.db WHERE Db='test' OR Db='test\\_%';

            -- Reload privilege tables
            FLUSH PRIVILEGES;
MYSQL_SECURE_EOF

        # Save root password securely
        cat > /root/.mysql_credentials << 'CREDS_EOF'
# MySQL Root Credentials
# Generated: $(date)
MYSQL_ROOT_PASSWORD=${ROOT_PASSWORD}
MYSQL_APP_PASSWORD=${APP_PASSWORD}
CREDS_EOF

        chmod 600 /root/.mysql_credentials

        echo "✅ MySQL secured with root password: ${ROOT_PASSWORD}"
        echo "📝 Credentials saved to /root/.mysql_credentials"
EOF

    print_success "MySQL security configuration complete"
}

# Create application database and user
setup_app_database() {
    print_status "Setting up application database..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Read credentials
        source /root/.mysql_credentials

        # Create application database and user
        mysql -u root -p"$MYSQL_ROOT_PASSWORD" << 'APP_DB_EOF'
            -- Create application database
            CREATE DATABASE IF NOT EXISTS social_automation_db
            CHARACTER SET utf8mb4
            COLLATE utf8mb4_unicode_ci;

            -- Create application user
            CREATE USER IF NOT EXISTS 'automation_user'@'localhost'
            IDENTIFIED BY '${MYSQL_APP_PASSWORD}';

            -- Grant permissions
            GRANT SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, DROP
            ON social_automation_db.*
            TO 'automation_user'@'localhost';

            -- Create session storage table
            USE social_automation_db;

            CREATE TABLE IF NOT EXISTS user_sessions (
                id VARCHAR(255) PRIMARY KEY,
                platform VARCHAR(50) NOT NULL,
                user_identifier VARCHAR(255) NOT NULL,
                session_data JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                expires_at TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE,
                INDEX idx_platform (platform),
                INDEX idx_user (user_identifier),
                INDEX idx_active (is_active),
                INDEX idx_expires (expires_at)
            );

            -- Create automation logs table
            CREATE TABLE IF NOT EXISTS automation_logs (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                platform VARCHAR(50) NOT NULL,
                action VARCHAR(100) NOT NULL,
                user_identifier VARCHAR(255),
                status ENUM('success', 'failure', 'warning') NOT NULL,
                message TEXT,
                metadata JSON,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_platform (platform),
                INDEX idx_status (status),
                INDEX idx_created (created_at)
            );

            -- Create campaigns table
            CREATE TABLE IF NOT EXISTS campaigns (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                platforms JSON,
                schedule_type ENUM('immediate', 'scheduled', 'recurring') DEFAULT 'immediate',
                scheduled_at TIMESTAMP NULL,
                status ENUM('draft', 'active', 'paused', 'completed') DEFAULT 'draft',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_status (status),
                INDEX idx_schedule (scheduled_at)
            );

            -- Create performance metrics table
            CREATE TABLE IF NOT EXISTS performance_metrics (
                id BIGINT AUTO_INCREMENT PRIMARY KEY,
                metric_name VARCHAR(100) NOT NULL,
                metric_value DECIMAL(10,2),
                platform VARCHAR(50),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_metric (metric_name),
                INDEX idx_platform (platform),
                INDEX idx_recorded (recorded_at)
            );

            FLUSH PRIVILEGES;
APP_DB_EOF

        echo "✅ Application database and tables created"

        # Update application environment with database credentials
        cd /opt/social-automation/current

        sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=${MYSQL_APP_PASSWORD}/" .env.production
        sed -i "s|DATABASE_URL=.*|DATABASE_URL=mysql://automation_user:${MYSQL_APP_PASSWORD}@localhost:3306/social_automation_db|" .env.production

        echo "✅ Database credentials updated in .env.production"
EOF

    print_success "Application database setup complete"
}

# Configure database backups
setup_database_backups() {
    print_status "Setting up database backups..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Create backup script
        cat > /usr/local/bin/backup-database.sh << 'BACKUP_EOF'
#!/bin/bash

# Database backup script
BACKUP_DIR="/opt/backups/database"
DATE=$(date +%Y%m%d-%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Source credentials
source /root/.mysql_credentials

# Create database backup
mysqldump -u automation_user -p"$MYSQL_APP_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --databases social_automation_db > "$BACKUP_DIR/db-backup-$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/db-backup-$DATE.sql"

# Remove old backups
find "$BACKUP_DIR" -name "db-backup-*.sql.gz" -mtime +$RETENTION_DAYS -delete

echo "Database backup created: $BACKUP_DIR/db-backup-$DATE.sql.gz"
BACKUP_EOF

        chmod +x /usr/local/bin/backup-database.sh

        # Schedule daily database backups
        echo "0 1 * * * /usr/local/bin/backup-database.sh" | crontab -

        echo "✅ Database backups configured (daily at 1 AM)"
EOF

    print_success "Database backup setup complete"
}

# Optimize database performance
optimize_database() {
    print_status "Optimizing database performance..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Create optimized MySQL configuration
        cat > /etc/mysql/mysql.conf.d/social-automation.cnf << 'MYSQL_CONF_EOF'
[mysqld]
# Social Media Automation - MySQL Optimizations

# Memory settings
innodb_buffer_pool_size = 128M
innodb_log_file_size = 32M
innodb_log_buffer_size = 8M
query_cache_size = 16M
query_cache_limit = 1M

# Connection settings
max_connections = 100
connect_timeout = 10
wait_timeout = 600
interactive_timeout = 600

# Security settings
local_infile = 0
skip_show_database

# Performance settings
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
thread_cache_size = 8
table_open_cache = 64

# Character set
character_set_server = utf8mb4
collation_server = utf8mb4_unicode_ci

# Binary logging (for replication if needed)
log_bin = /var/log/mysql/mysql-bin.log
binlog_expire_logs_seconds = 2592000
max_binlog_size = 100M

# Slow query logging
slow_query_log = 1
slow_query_log_file = /var/log/mysql/slow.log
long_query_time = 2
MYSQL_CONF_EOF

        # Restart MySQL to apply configuration
        systemctl restart mysql

        echo "✅ Database performance optimized"
EOF

    print_success "Database optimization complete"
}

# Main function
main() {
    echo "🛡️  Starting Database Security & Setup"
    echo "======================================"
    echo "Target VPS: $VPS_USER@$VPS_IP"
    echo ""

    if [ "$VPS_IP" = "your-vps-ip" ]; then
        print_error "Please provide VPS IP address"
        exit 1
    fi

    # Database setup steps
    install_mysql
    secure_mysql
    setup_app_database
    setup_database_backups
    optimize_database

    echo ""
    echo "🛡️  ====================================="
    echo "🛡️  DATABASE SETUP COMPLETED!"
    echo "🛡️  ====================================="
    echo ""
    echo "📊 Database Information:"
    echo "   Database: social_automation_db"
    echo "   User: automation_user"
    echo "   Host: localhost"
    echo "   Tables: user_sessions, automation_logs, campaigns, performance_metrics"
    echo ""
    echo "💾 Backup Configuration:"
    echo "   Schedule: Daily at 1:00 AM"
    echo "   Location: /opt/backups/database/"
    echo "   Retention: 30 days"
    echo ""
    echo "⚠️  SECURITY NOTES:"
    echo "   1. Database passwords saved to /root/.mysql_credentials"
    echo "   2. Change default email addresses in scripts"
    echo "   3. Monitor database performance regularly"
    echo "   4. Test backup restoration procedures"
    echo ""
    echo "✅ Database is ready for production use!"
}

main "$@"
