#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Kyron Medical — EC2 User Data Script
# Paste this into the "User data" field when launching your EC2 instance.
# It will automatically install everything and start the app on boot.
#
# After instance launches (~3-4 min):
#   1. SSH in: ssh -i your-key.pem ubuntu@YOUR_EC2_IP
#   2. Edit secrets: sudo nano /opt/kyron-medical/.env
#   3. Restart: pm2 restart kyron-medical
# ─────────────────────────────────────────────────────────────────────────────
set -e
exec > /var/log/kyron-setup.log 2>&1

echo "=== Kyron Medical Setup Starting ==="

# System packages
apt-get update -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt-get install -y -qq nodejs

# PM2
npm install -g pm2 --silent

# App directory
mkdir -p /opt/kyron-medical
cd /opt/kyron-medical

# Clone from GitHub
git clone https://github.com/bhagyashreewagh/kyron-medical.git .

# Build backend
cd /opt/kyron-medical/backend
npm ci --silent
npm run build

# Build frontend
cd /opt/kyron-medical/frontend
npm ci --silent
npm run build

# Create .env (fill in your keys after launch)
cat > /opt/kyron-medical/.env << 'ENVEOF'
PORT=3001
NODE_ENV=production
ANTHROPIC_API_KEY=FILL_IN_AFTER_LAUNCH
GMAIL_USER=bwagh@uw.edu
GMAIL_APP_PASSWORD=FILL_IN_AFTER_LAUNCH
VAPI_API_KEY=FILL_IN_AFTER_LAUNCH
VAPI_PHONE_NUMBER_ID=FILL_IN_AFTER_LAUNCH
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_CALENDAR_ID=primary
ENVEOF

# PM2 config
cat > /opt/kyron-medical/ecosystem.config.cjs << 'PM2EOF'
module.exports = {
  apps: [{
    name: 'kyron-medical',
    script: './backend/dist/server.js',
    cwd: '/opt/kyron-medical',
    instances: 1,
    autorestart: true,
    env: { NODE_ENV: 'production', PORT: 3001 },
    env_file: '/opt/kyron-medical/.env',
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    time: true,
  }]
};
PM2EOF

mkdir -p /opt/kyron-medical/logs
pm2 start /opt/kyron-medical/ecosystem.config.cjs
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | bash || true

# Nginx
cat > /etc/nginx/sites-available/kyron-medical << 'NGINXEOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/kyron-medical /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx
systemctl enable nginx

echo "=== Kyron Medical Setup Complete ==="
echo "App running at http://$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4)"
echo "Next: SSH in and fill in your API keys in /opt/kyron-medical/.env"
