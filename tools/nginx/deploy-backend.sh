#!/usr/bin/env bash
set -euo pipefail

TARGET_DIR="${1:-/opt/bvote-backend}"
API_PORT="${2:-3000}"

echo "Backend target dir: $TARGET_DIR"
echo "API port: $API_PORT"

detect_pkg() {
  if command -v apt-get >/dev/null 2>&1; then echo apt; return; fi
  if command -v dnf >/dev/null 2>&1; then echo dnf; return; fi
  if command -v yum >/dev/null 2>&1; then echo yum; return; fi
  echo unknown
}

PKG=$(detect_pkg)
if [ "$PKG" = "unknown" ]; then
  echo "Unsupported OS: no apt/dnf/yum found" >&2
  exit 1
fi

# Install Node.js and PM2 if missing
if ! command -v node >/dev/null 2>&1; then
  if [ "$PKG" = "apt" ]; then
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt-get install -y nodejs
  else
    # Try NodeSource for RHEL/CentOS/Fedora
    curl -fsSL https://rpm.nodesource.com/setup_18.x | bash - || true
    $PKG install -y nodejs npm || $PKG install -y nodejs || true
  fi
fi

if ! command -v pm2 >/dev/null 2>&1; then
  npm install -g pm2
fi

# Prepare target directory
mkdir -p "$TARGET_DIR"

# Extract backend bundle from uploaded bundle if present
if [ -f /tmp/deploy/bundle.tgz ]; then
  rm -rf /tmp/deploy/extract
  mkdir -p /tmp/deploy/extract
  tar -xzf /tmp/deploy/bundle.tgz -C /tmp/deploy/extract
  if [ -d /tmp/deploy/extract/backend ]; then
    if command -v rsync >/dev/null 2>&1; then
      rsync -a --delete /tmp/deploy/extract/backend/ "$TARGET_DIR/"
    else
      rm -rf "$TARGET_DIR"/*
      cp -a /tmp/deploy/extract/backend/. "$TARGET_DIR/"
    fi
  fi
fi

# Install dependencies
cd "$TARGET_DIR"
if [ -f package-lock.json ]; then
  npm ci --no-audit --no-fund
else
  npm install --no-audit --no-fund
fi

# Determine entry file
ENTRY="server-production.js"
if [ ! -f "$ENTRY" ]; then
  if [ -f "server.js" ]; then ENTRY="server.js"; else ENTRY="simple-server.js"; fi
fi

# Create ecosystem config for pm2
cat > ecosystem.config.js <<ECONF
module.exports = {
  apps: [
    {
      name: 'bvote-backend',
      script: '$ENTRY',
      cwd: '$TARGET_DIR',
      env: {
        NODE_ENV: 'production',
        PORT: '$API_PORT'
      }
    }
  ]
}
ECONF

# Start/restart with pm2
pm2 startOrReload ecosystem.config.js
pm2 save
pm2 startup -u $(whoami) --hp $(eval echo ~)

# Health check
sleep 2
curl -s http://127.0.0.1:${API_PORT}/api/health | cat || true

echo "Backend deployed and running on port ${API_PORT}."
