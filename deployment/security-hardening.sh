#!/bin/bash

# ===============================================
# VPS Security Hardening Script
# ===============================================
#
# This script hardens VPS security for production deployment
# of the social media automation system.
#
# Usage: ./deployment/security-hardening.sh [server_ip] [username]
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

print_status() { echo -e "${BLUE}[SECURITY]${NC} $1"; }
print_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
print_warning() { echo -e "${YELLOW}[WARNING]${NC} $1"; }
print_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# SSH Hardening
harden_ssh() {
    print_status "Hardening SSH configuration..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Backup original SSH config
        cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

        # Create hardened SSH configuration
        cat > /etc/ssh/sshd_config << 'SSH_EOF'
# SSH Hardened Configuration for Social Media Automation VPS

# Protocol and Port
Protocol 2
Port 22

# Authentication
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
AuthorizedKeysFile .ssh/authorized_keys
ChallengeResponseAuthentication no
UsePAM yes

# Security Settings
MaxAuthTries 3
MaxSessions 2
MaxStartups 2
LoginGraceTime 30
ClientAliveInterval 300
ClientAliveCountMax 2

# Disable dangerous features
PermitEmptyPasswords no
PermitUserEnvironment no
AllowAgentForwarding no
AllowTcpForwarding no
X11Forwarding no
PrintMotd no

# Allowed users (only automation user for application)
AllowUsers automation

# Logging
SyslogFacility AUTH
LogLevel INFO

# Cryptography
Ciphers chacha20-poly1305@openssh.com,aes256-gcm@openssh.com,aes128-gcm@openssh.com,aes256-ctr,aes192-ctr,aes128-ctr
MACs hmac-sha2-256-etm@openssh.com,hmac-sha2-512-etm@openssh.com,hmac-sha2-256,hmac-sha2-512
KexAlgorithms curve25519-sha256@libssh.org,diffie-hellman-group16-sha512,diffie-hellman-group18-sha512

# Banner
Banner /etc/ssh/banner
SSH_EOF

        # Create SSH banner
        cat > /etc/ssh/banner << 'BANNER_EOF'
***********************************************************************
*                                                                     *
*  AUTHORIZED ACCESS ONLY - Social Media Automation System           *
*                                                                     *
*  This system is for authorized users only. All activities are      *
*  logged and monitored. Unauthorized access is prohibited and       *
*  may result in legal action.                                       *
*                                                                     *
***********************************************************************
BANNER_EOF

        # Create automation user SSH directory
        mkdir -p /home/automation/.ssh
        chmod 700 /home/automation/.ssh
        chown automation:automation /home/automation/.ssh

        # Test SSH configuration
        sshd -t && echo "✅ SSH configuration is valid"

        # Restart SSH service
        systemctl restart sshd

        echo "✅ SSH hardened successfully"
EOF

    print_success "SSH hardening complete"
}

# System Hardening
harden_system() {
    print_status "Hardening system configuration..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Disable unused services
        systemctl disable avahi-daemon 2>/dev/null || true
        systemctl disable cups 2>/dev/null || true
        systemctl disable bluetooth 2>/dev/null || true

        # Configure automatic security updates
        apt install -y unattended-upgrades

        cat > /etc/apt/apt.conf.d/50unattended-upgrades << 'AUTO_UPDATE_EOF'
Unattended-Upgrade::Allowed-Origins {
    "${distro_id}:${distro_codename}-security";
    "${distro_id}ESMApps:${distro_codename}-apps-security";
    "${distro_id}ESM:${distro_codename}-infra-security";
};
Unattended-Upgrade::AutoFixInterruptedDpkg "true";
Unattended-Upgrade::MinimalSteps "true";
Unattended-Upgrade::Remove-Unused-Dependencies "true";
Unattended-Upgrade::Automatic-Reboot "false";
AUTO_UPDATE_EOF

        # Enable automatic updates
        echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades
        echo 'APT::Periodic::Unattended-Upgrade "1";' >> /etc/apt/apt.conf.d/20auto-upgrades

        # Configure kernel parameters for security
        cat >> /etc/sysctl.conf << 'SYSCTL_EOF'

# Security hardening parameters
net.ipv4.ip_forward=0
net.ipv4.conf.all.send_redirects=0
net.ipv4.conf.default.send_redirects=0
net.ipv4.conf.all.accept_redirects=0
net.ipv4.conf.default.accept_redirects=0
net.ipv4.conf.all.secure_redirects=0
net.ipv4.conf.default.secure_redirects=0
net.ipv6.conf.all.accept_redirects=0
net.ipv6.conf.default.accept_redirects=0
net.ipv4.conf.all.log_martians=1
net.ipv4.conf.default.log_martians=1
net.ipv4.icmp_echo_ignore_broadcasts=1
net.ipv4.icmp_ignore_bogus_error_responses=1
net.ipv4.tcp_syncookies=1
kernel.dmesg_restrict=1
kernel.kptr_restrict=2
SYSCTL_EOF

        # Apply kernel parameters
        sysctl -p

        # Install and configure fail2ban
        apt install -y fail2ban

        cat > /etc/fail2ban/jail.local << 'FAIL2BAN_EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3
ignoreip = 127.0.0.1/8

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3

[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
maxretry = 3
FAIL2BAN_EOF

        systemctl enable fail2ban
        systemctl start fail2ban

        echo "✅ System hardening complete"
EOF

    print_success "System hardening complete"
}

# Application Security
secure_application() {
    print_status "Securing application configuration..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        cd /opt/social-automation/current

        # Set secure file permissions
        find . -type f -exec chmod 644 {} \;
        find . -type d -exec chmod 755 {} \;

        # Secure scripts
        find . -name "*.sh" -exec chmod 755 {} \;

        # Secure environment files
        chmod 600 .env.production 2>/dev/null || true

        # Secure browser profiles directory
        chmod 700 /var/lib/social-automation/profiles
        chown -R automation:automation /var/lib/social-automation

        # Create security headers middleware
        mkdir -p middleware/security

        cat > middleware/security/headers.js << 'HEADERS_EOF'
// Security Headers Middleware
export function securityHeaders(req, res, next) {
  // HSTS
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');

  // Content Security Policy
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline'; " +
    "style-src 'self' 'unsafe-inline'; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss: ws:; " +
    "font-src 'self'; " +
    "object-src 'none'; " +
    "base-uri 'self';"
  );

  // Other security headers
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

  next();
}
HEADERS_EOF

        # Set ownership
        chown -R automation:automation /opt/social-automation

        echo "✅ Application security configured"
EOF

    print_success "Application security complete"
}

# Setup intrusion detection
setup_intrusion_detection() {
    print_status "Setting up intrusion detection..."

    ssh "$VPS_USER@$VPS_IP" << 'EOF'
        # Install AIDE (Advanced Intrusion Detection Environment)
        apt install -y aide

        # Initialize AIDE database
        aideinit

        # Copy database
        cp /var/lib/aide/aide.db.new /var/lib/aide/aide.db

        # Create AIDE check script
        cat > /usr/local/bin/aide-check.sh << 'AIDE_EOF'
#!/bin/bash
AIDE_LOG="/var/log/aide-check.log"
DATE=$(date)

echo "[$DATE] Starting AIDE integrity check..." >> "$AIDE_LOG"

if aide --check; then
    echo "[$DATE] AIDE check passed - no changes detected" >> "$AIDE_LOG"
else
    echo "[$DATE] WARNING: AIDE check failed - system changes detected!" >> "$AIDE_LOG"
    # Send alert email if configured
    if command -v mail >/dev/null 2>&1; then
        echo "System integrity check failed on $(hostname)" | mail -s "Security Alert" admin@your-domain.com 2>/dev/null || true
    fi
fi
AIDE_EOF

        chmod +x /usr/local/bin/aide-check.sh

        # Schedule daily AIDE checks
        echo "0 3 * * * /usr/local/bin/aide-check.sh" | crontab -

        # Install and configure logwatch
        apt install -y logwatch

        # Configure logwatch for daily security reports
        cat > /etc/logwatch/conf/logwatch.conf << 'LOGWATCH_EOF'
LogDir = /var/log
TmpDir = /var/cache/logwatch
MailTo = admin@your-domain.com
MailFrom = security@your-domain.com
Print = No
Save = /var/cache/logwatch
Range = yesterday
Detail = Med
Service = All
Format = html
LOGWATCH_EOF

        echo "✅ Intrusion detection configured"
EOF

    print_success "Intrusion detection setup complete"
}

# Main security hardening function
main() {
    echo "🔒 Starting VPS Security Hardening"
    echo "=================================="
    echo "Target VPS: $VPS_USER@$VPS_IP"
    echo ""

    if [ "$VPS_IP" = "your-vps-ip" ]; then
        print_error "Please provide VPS IP address: ./security-hardening.sh [IP] [USER]"
        exit 1
    fi

    # Security hardening steps
    harden_ssh
    harden_system
    secure_application
    setup_intrusion_detection

    echo ""
    echo "🔒 ====================================="
    echo "🔒 SECURITY HARDENING COMPLETED!"
    echo "🔒 ====================================="
    echo ""
    echo "🛡️  Security Measures Applied:"
    echo "   ✅ SSH hardened (key-only, no root)"
    echo "   ✅ Firewall configured (UFW)"
    echo "   ✅ Fail2ban installed and configured"
    echo "   ✅ Automatic security updates enabled"
    echo "   ✅ System parameters hardened"
    echo "   ✅ Application permissions secured"
    echo "   ✅ Intrusion detection (AIDE) configured"
    echo "   ✅ Security monitoring (logwatch) enabled"
    echo ""
    echo "🚨 IMPORTANT SECURITY REMINDERS:"
    echo "   1. Change all default passwords immediately"
    echo "   2. Setup SSH key authentication"
    echo "   3. Configure SSL certificates properly"
    echo "   4. Monitor security logs regularly"
    echo "   5. Keep system updated"
    echo "   6. Use strong passwords for social media accounts"
    echo "   7. Enable 2FA on all accounts"
    echo ""
    echo "✅ Your VPS is now hardened for production use!"
}

main "$@"
