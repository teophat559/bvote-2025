#!/bin/bash

# BVOTE Security Setup Script
# This script configures security settings for production deployment

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}"
    exit 1
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] INFO: $1${NC}"
}

# Generate secure random string
generate_secret() {
    openssl rand -hex 32
}

# Generate JWT secrets
generate_jwt_secrets() {
    log "Generating JWT secrets..."

    JWT_SECRET=$(generate_secret)
    JWT_REFRESH_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)

    echo "# Generated JWT Secrets - $(date)"
    echo "JWT_SECRET=$JWT_SECRET"
    echo "JWT_REFRESH_SECRET=$JWT_REFRESH_SECRET"
    echo "SESSION_SECRET=$SESSION_SECRET"
    echo ""
}

# Setup firewall rules
setup_firewall() {
    log "Setting up firewall rules..."

    if command -v ufw &> /dev/null; then
        # Enable UFW
        sudo ufw --force enable

        # Default policies
        sudo ufw default deny incoming
        sudo ufw default allow outgoing

        # Allow SSH (be careful with this!)
        sudo ufw allow ssh

        # Allow HTTP and HTTPS
        sudo ufw allow 80
        sudo ufw allow 443

        # Allow backend port (only from localhost)
        sudo ufw allow from 127.0.0.1 to any port 3000

        # Allow database port (only from localhost)
        sudo ufw allow from 127.0.0.1 to any port 3306

        # Show status
        sudo ufw status verbose

        log "Firewall configured successfully"
    else
        warn "UFW not found. Please configure firewall manually."
    fi
}

# Secure MySQL installation
secure_mysql() {
    log "Securing MySQL installation..."

    if command -v mysql &> /dev/null; then
        info "Please run 'sudo mysql_secure_installation' manually to:"
        info "1. Set root password"
        info "2. Remove anonymous users"
        info "3. Disallow root login remotely"
        info "4. Remove test database"
        info "5. Reload privilege tables"
    else
        warn "MySQL not found. Skipping MySQL security setup."
    fi
}

# Setup SSL certificate
setup_ssl() {
    local domain=$1

    if [ -z "$domain" ]; then
        warn "No domain provided. Skipping SSL setup."
        return
    fi

    log "Setting up SSL certificate for $domain..."

    if command -v certbot &> /dev/null; then
        # Install certificate
        sudo certbot --standalone -d "$domain" -d "admin.$domain" -d "user.$domain" --non-interactive --agree-tos --email "admin@$domain"

        # Setup auto-renewal
        sudo systemctl enable certbot.timer
        sudo systemctl start certbot.timer

        # Test renewal
        sudo certbot renew --dry-run

        log "SSL certificate configured successfully"
    else
        warn "Certbot not found. Please install SSL certificate manually."
    fi
}

# Harden SSH configuration
harden_ssh() {
    log "Hardening SSH configuration..."

    SSH_CONFIG="/etc/ssh/sshd_config"

    if [ -f "$SSH_CONFIG" ]; then
        # Backup original config
        sudo cp "$SSH_CONFIG" "$SSH_CONFIG.backup.$(date +%Y%m%d)"

        # Apply security settings
        sudo sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' "$SSH_CONFIG"
        sudo sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' "$SSH_CONFIG"
        sudo sed -i 's/#PubkeyAuthentication yes/PubkeyAuthentication yes/' "$SSH_CONFIG"
        sudo sed -i 's/#Port 22/Port 2222/' "$SSH_CONFIG"

        # Add additional security settings
        echo "" | sudo tee -a "$SSH_CONFIG"
        echo "# BVOTE Security Settings" | sudo tee -a "$SSH_CONFIG"
        echo "Protocol 2" | sudo tee -a "$SSH_CONFIG"
        echo "MaxAuthTries 3" | sudo tee -a "$SSH_CONFIG"
        echo "MaxStartups 3" | sudo tee -a "$SSH_CONFIG"
        echo "LoginGraceTime 30" | sudo tee -a "$SSH_CONFIG"
        echo "AllowUsers $(whoami)" | sudo tee -a "$SSH_CONFIG"

        # Restart SSH service
        sudo systemctl restart sshd

        log "SSH configuration hardened"
        warn "SSH port changed to 2222. Update your firewall and connections accordingly."
    else
        warn "SSH config file not found. Skipping SSH hardening."
    fi
}

# Setup fail2ban
setup_fail2ban() {
    log "Setting up fail2ban..."

    if command -v fail2ban-client &> /dev/null; then
        # Create custom jail for BVOTE
        cat > /tmp/bvote.conf << EOF
[bvote-auth]
enabled = true
port = 3000
protocol = tcp
filter = bvote-auth
logpath = /var/www/bvote/backend/logs/security.log
maxretry = 5
bantime = 3600
findtime = 600

[bvote-ddos]
enabled = true
port = 80,443,3000
protocol = tcp
filter = bvote-ddos
logpath = /var/www/bvote/backend/logs/app.log
maxretry = 50
bantime = 300
findtime = 60
EOF

        # Create filters
        cat > /tmp/bvote-auth.conf << EOF
[Definition]
failregex = ^.*"Failed login attempt".*"ip":"<HOST>".*$
ignoreregex =
EOF

        cat > /tmp/bvote-ddos.conf << EOF
[Definition]
failregex = ^.*"Rate limit exceeded".*"ip":"<HOST>".*$
ignoreregex =
EOF

        # Install configurations
        sudo mv /tmp/bvote.conf /etc/fail2ban/jail.d/
        sudo mv /tmp/bvote-auth.conf /etc/fail2ban/filter.d/
        sudo mv /tmp/bvote-ddos.conf /etc/fail2ban/filter.d/

        # Restart fail2ban
        sudo systemctl restart fail2ban
        sudo systemctl enable fail2ban

        log "Fail2ban configured successfully"
    else
        warn "Fail2ban not found. Please install it for additional security."
    fi
}

# Create security audit script
create_audit_script() {
    log "Creating security audit script..."

    cat > security-audit.sh << 'EOF'
#!/bin/bash

# BVOTE Security Audit Script

echo "=== BVOTE Security Audit Report ==="
echo "Date: $(date)"
echo ""

# Check firewall status
echo "=== Firewall Status ==="
if command -v ufw &> /dev/null; then
    sudo ufw status verbose
else
    echo "UFW not installed"
fi
echo ""

# Check fail2ban status
echo "=== Fail2ban Status ==="
if command -v fail2ban-client &> /dev/null; then
    sudo fail2ban-client status
    echo ""
    sudo fail2ban-client status bvote-auth 2>/dev/null || echo "bvote-auth jail not active"
    sudo fail2ban-client status bvote-ddos 2>/dev/null || echo "bvote-ddos jail not active"
else
    echo "Fail2ban not installed"
fi
echo ""

# Check SSL certificate
echo "=== SSL Certificate Status ==="
if command -v certbot &> /dev/null; then
    sudo certbot certificates
else
    echo "Certbot not installed"
fi
echo ""

# Check system updates
echo "=== System Updates ==="
if command -v apt &> /dev/null; then
    apt list --upgradable 2>/dev/null | wc -l
    echo "packages available for update"
elif command -v yum &> /dev/null; then
    yum check-update 2>/dev/null | grep -c "updates"
    echo "packages available for update"
fi
echo ""

# Check log files
echo "=== Log File Sizes ==="
if [ -d "/var/www/bvote/backend/logs" ]; then
    du -sh /var/www/bvote/backend/logs/*
else
    echo "Log directory not found"
fi
echo ""

# Check running processes
echo "=== BVOTE Processes ==="
ps aux | grep -E "(node|lsws|mysql)" | grep -v grep
echo ""

# Check disk usage
echo "=== Disk Usage ==="
df -h /
echo ""

# Check memory usage
echo "=== Memory Usage ==="
free -h
echo ""

echo "=== End of Audit Report ==="
EOF

    chmod +x security-audit.sh
    log "Security audit script created: ./security-audit.sh"
}

# Main security setup function
main() {
    local domain=$1

    log "Starting BVOTE security setup..."

    # Check if running as root
    if [ "$EUID" -eq 0 ]; then
        error "Please don't run this script as root. Use a sudo-enabled user instead."
    fi

    # Generate secrets
    info "Generated secrets (save these in your .env.production file):"
    generate_jwt_secrets

    # Setup firewall
    setup_firewall

    # Setup SSL if domain provided
    if [ -n "$domain" ]; then
        setup_ssl "$domain"
    fi

    # Harden SSH
    read -p "Do you want to harden SSH configuration? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        harden_ssh
    fi

    # Setup fail2ban
    read -p "Do you want to setup fail2ban? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_fail2ban
    fi

    # Create audit script
    create_audit_script

    # Final recommendations
    echo ""
    log "Security setup completed!"
    echo ""
    info "Additional security recommendations:"
    info "1. Regularly update system packages"
    info "2. Monitor log files for suspicious activity"
    info "3. Setup automated backups"
    info "4. Use strong passwords for all accounts"
    info "5. Enable 2FA where possible"
    info "6. Regularly run the security audit script"
    info "7. Keep Node.js and dependencies updated"
    echo ""
    warn "Don't forget to:"
    warn "1. Update your .env.production with the generated secrets"
    warn "2. Configure your domain in environment files"
    warn "3. Test all functionality after security setup"
    warn "4. Update firewall rules if you change ports"
}

# Parse command line arguments
if [ $# -eq 0 ]; then
    main
else
    main "$1"
fi
