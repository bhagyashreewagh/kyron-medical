#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Kyron Medical — EC2 Deployment Script
# Tested on Ubuntu 22.04 LTS (t3.small or larger recommended)
# ─────────────────────────────────────────────────────────────────────────────
set -e

APP_DIR="/opt/kyron-medical"
DOMAIN="${DOMAIN:-your-domain.com}"   # Set via env or edit here
EMAIL="${EMAIL:-admin@your-domain.com}"

echo "══════════════════════════════════════════"
echo "  Kyron Medical — Deployment"
echo "══════════════════════════════════════════"

# ── 1. System packages ────────────────────────────────────────────────────────
echo "→ Installing system packages..."
sudo apt-get update -qq
sudo apt-get install -y -qq curl git nginx certbot python3-certbot-nginx

# ── 2. Node.js 20 ─────────────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "→ Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y -qq nodejs
fi
echo "   Node: $(node --version), npm: $(npm --version)"

# ── 3. PM2 ───────────────────────────────────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  echo "→ Installing PM2..."
  sudo npm install -g pm2 --silent
fi

# ── 4. Clone / update repo ────────────────────────────────────────────────────
echo "→ Setting up application directory..."
sudo mkdir -p "$APP_DIR"
sudo chown "$USER:$USER" "$APP_DIR"

# If running from repo, copy files; otherwise git clone
if [ -f "$(dirname "$0")/backend/package.json" ]; then
  echo "   Copying local files to $APP_DIR..."
  cp -r "$(dirname "$0")/." "$APP_DIR/"
else
  echo "   Please clone your repo to $APP_DIR manually, then re-run."
  exit 1
fi

cd "$APP_DIR"

# ── 5. Install & build backend ────────────────────────────────────────────────
echo "→ Building backend..."
cd backend
npm ci --silent
npm run build
cd ..

# ── 6. Install & build frontend ───────────────────────────────────────────────
echo "→ Building frontend..."
cd frontend
npm ci --silent
npm run build
cd ..

# ── 7. Environment file ───────────────────────────────────────────────────────
if [ ! -f "$APP_DIR/.env" ]; then
  echo ""
  echo "⚠️  No .env file found at $APP_DIR/.env"
  echo "   Copy .env.example and fill in your API keys:"
  echo "   cp $APP_DIR/.env.example $APP_DIR/.env && nano $APP_DIR/.env"
  echo ""
fi

# ── 8. PM2 process ───────────────────────────────────────────────────────────
echo "→ Configuring PM2..."
cat > "$APP_DIR/ecosystem.config.cjs" << 'EOF'
module.exports = {
  apps: [{
    name: 'kyron-medical',
    script: './backend/dist/server.js',
    cwd: '/opt/kyron-medical',
    instances: 1,
    autorestart: true,
    watch: false,
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    env_file: '/opt/kyron-medical/.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
  }]
};
EOF

mkdir -p "$APP_DIR/logs"
pm2 delete kyron-medical 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.cjs"
pm2 save
pm2 startup | tail -1 | sudo bash 2>/dev/null || true

# ── 9. Nginx config ───────────────────────────────────────────────────────────
echo "→ Configuring Nginx..."
sudo tee /etc/nginx/sites-available/kyron-medical > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Proxy to Node.js
    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # SSE support (streaming chat)
        proxy_buffering off;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/kyron-medical /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# ── 10. SSL with Let's Encrypt ────────────────────────────────────────────────
if [[ "$DOMAIN" != "your-domain.com" ]]; then
  echo "→ Obtaining SSL certificate for $DOMAIN..."
  sudo certbot --nginx -d "$DOMAIN" -d "www.$DOMAIN" \
    --non-interactive --agree-tos --email "$EMAIL" \
    --redirect 2>/dev/null || echo "   (certbot skipped — may need DNS to propagate first)"
else
  echo "⚠️  Skipping SSL — set DOMAIN env var to your actual domain"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "══════════════════════════════════════════"
echo "  ✅ Deployment complete!"
echo "══════════════════════════════════════════"
echo ""
echo "  App running at: http://$DOMAIN"
[[ "$DOMAIN" != "your-domain.com" ]] && echo "  HTTPS:          https://$DOMAIN"
echo ""
echo "  PM2 commands:"
echo "  pm2 status           — check app status"
echo "  pm2 logs kyron-medical — view logs"
echo "  pm2 restart kyron-medical — restart"
echo ""
echo "  Don't forget to set API keys in: $APP_DIR/.env"
echo ""
