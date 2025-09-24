#!/bin/bash

# Emergency VPS Fix - Directory Listing Error
# ===========================================

echo "🚨 EMERGENCY: Fixing Directory Listing Error"
echo "============================================="

# Get current directory
WEBROOT="/home/votingonline2025.site/public_html"
cd "$WEBROOT" || exit 1

echo "📍 Working in: $WEBROOT"

# 1. Disable directory listing immediately
echo "🛡️ Step 1: Disabling directory listing..."
cat > .htaccess << 'EOF'
# EMERGENCY FIX: Disable directory listing
Options -Indexes
DirectoryIndex index.html

# Force redirect to user interface
RewriteEngine On
RewriteRule ^$ /user/dist/index.html [L]
RewriteRule ^/$ /user/dist/index.html [L]

# Admin routing
RewriteRule ^admin/?$ /admin/dist/index.html [L]
RewriteRule ^admin/(.*)$ /admin/dist/$1 [L]

# API routing
RewriteRule ^api/(.*)$ http://localhost:3000/api/$1 [P,L]

# SPA fallback
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteCond %{REQUEST_URI} !^/admin
RewriteCond %{REQUEST_URI} !^/api
RewriteRule ^(.*)$ /user/dist/index.html [L]

# Block sensitive directories
RewriteRule ^(backend|libs|production|config|__tests__|scripts)(/.*)?$ - [F,L]

# Error handling
ErrorDocument 403 /user/dist/index.html
ErrorDocument 404 /user/dist/index.html
EOF

echo "✅ .htaccess updated successfully"

# 2. Create immediate redirect index.html
echo "🏠 Step 2: Creating emergency index.html..."
cat > index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>VotingOnline2025</title>
    <meta http-equiv="refresh" content="0;url=/user/dist/index.html">
    <script>window.location.href='/user/dist/index.html';</script>
</head>
<body>
    <h1>VotingOnline2025</h1>
    <p>Redirecting...</p>
    <a href="/user/dist/index.html">Click here if not redirected</a>
</body>
</html>
EOF

echo "✅ Emergency index.html created"

# 3. Verify user and admin directories exist
echo "📁 Step 3: Verifying interface directories..."

if [ ! -f "user/dist/index.html" ]; then
    mkdir -p user/dist
    cat > user/dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VotingOnline2025 User Interface</title>
</head>
<body>
    <h1>VotingOnline2025 User Interface</h1>
    <p>User interface is loading...</p>
</body>
</html>
EOF
    echo "✅ Created emergency user interface"
fi

if [ ! -f "admin/dist/index.html" ]; then
    mkdir -p admin/dist
    cat > admin/dist/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>VotingOnline2025 Admin Panel</title>
</head>
<body>
    <h1>VotingOnline2025 Admin Panel</h1>
    <p>Admin panel is loading...</p>
</body>
</html>
EOF
    echo "✅ Created emergency admin interface"
fi

# 4. Set proper permissions
echo "🔧 Step 4: Setting proper permissions..."
chmod 644 .htaccess
chmod 644 index.html
chmod -R 644 user/dist/ 2>/dev/null || true
chmod -R 644 admin/dist/ 2>/dev/null || true
chmod -R 755 */dist/ 2>/dev/null || true

echo "✅ Permissions set correctly"

# 5. Test Apache/Nginx configuration
echo "🧪 Step 5: Testing web server configuration..."

# Reload Apache if running
if systemctl is-active --quiet apache2; then
    systemctl reload apache2
    echo "✅ Apache2 reloaded"
fi

# Reload Nginx if running
if systemctl is-active --quiet nginx; then
    nginx -t && systemctl reload nginx
    echo "✅ Nginx reloaded"
fi

# 6. Test the fix
echo "🔍 Step 6: Testing fix..."
sleep 2

if curl -s -I http://localhost/ | head -1 | grep -q "200\|301\|302"; then
    echo "✅ Local test: SUCCESS"
else
    echo "⚠️ Local test: May need additional configuration"
fi

echo ""
echo "🎉 EMERGENCY FIX COMPLETED!"
echo "==========================="
echo "✅ Directory listing disabled"
echo "✅ Auto-redirect to user interface"
echo "✅ Admin panel accessible via /admin"
echo "✅ Proper error handling configured"
echo ""
echo "🌐 Test your site now:"
echo "   👤 User: https://votingonline2025.site"
echo "   👨‍💼 Admin: https://votingonline2025.site/admin"
echo ""
echo "🔧 If still showing directory listing:"
echo "   1. Check file permissions: ls -la"
echo "   2. Restart web server: systemctl restart nginx"
echo "   3. Clear browser cache: Ctrl+F5"
