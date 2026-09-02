#!/usr/bin/env bash
# ==============================================================================
# Nexus Edu-Business Operations CRM — 1-Click VPS Deployment Script
# Optimized for Hostinger VPS / Ubuntu 20.04, 22.04, 24.04 LTS
# ==============================================================================

set -e

# Visual colors
CYAN='\033[0;36m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${CYAN}"
echo "╔═══════════════════════════════════════════════════════════════════╗"
echo "║       🎓 NEXUS CRM — 1-CLICK HOSTINGER VPS AUTO-DEPLOYMENT        ║"
echo "╚═══════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}[ERROR] Please run this script as root (sudo bash deploy.sh)${NC}"
  exit 1
fi

echo -e "${YELLOW}[1/7] Updating system packages & installing core dependencies...${NC}"
apt-get update -y && apt-get upgrade -y
apt-get install -y curl git nginx ufw build-essential

echo -e "${YELLOW}[2/7] Installing Node.js 20 LTS via NodeSource...${NC}"
if ! command -v node &> /dev/null || [ "$(node -v | cut -d'.' -f1)" != "v20" ]; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi

echo -e "${GREEN}✓ Node.js version: $(node -v) | npm version: $(npm -v)${NC}"

echo -e "${YELLOW}[3/7] Installing global process managers (PM2 & TSX)...${NC}"
npm install -g pm2 tsx

echo -e "${YELLOW}[4/7] Setting up project directory at /var/www/educate-crm...${NC}"
mkdir -p /var/www
cd /var/www

if [ -d "/var/www/educate-crm/.git" ]; then
  echo -e "Pulling latest code from GitHub..."
  cd /var/www/educate-crm
  git fetch origin main
  git reset --hard origin/main
else
  echo -e "Cloning repository from GitHub..."
  rm -rf /var/www/educate-crm
  git clone https://github.com/eskay243/educate-crm.git /var/www/educate-crm
  cd /var/www/educate-crm
fi

echo -e "${YELLOW}[5/7] Installing npm dependencies & compiling frontend build...${NC}"
npm install
npm run build

echo -e "${YELLOW}[6/7] Configuring PM2 Background Daemon for Express Backend...${NC}"
pm2 delete nexus-crm-api 2>/dev/null || true
pm2 start "npx tsx server/server.ts" --name "nexus-crm-api"
pm2 startup systemd -u root --hp /root || true
pm2 save

echo -e "${YELLOW}[7/7] Configuring Nginx Reverse Proxy & Firewall...${NC}"

# Write Nginx configuration
cat << 'NGINX_EOF' > /etc/nginx/sites-available/nexus-crm
server {
    listen 80;
    server_name _;

    # Frontend Single Page Application
    location / {
        root /var/www/educate-crm/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API Proxy to Express Backend (Port 5001)
    location /api/ {
        proxy_pass http://127.0.0.1:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
NGINX_EOF

ln -sf /etc/nginx/sites-available/nexus-crm /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test Nginx and reload
nginx -t
systemctl restart nginx

# Firewall
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable

SERVER_IP=$(curl -s http://checkip.amazonaws.com || hostname -I | awk '{print $1}')

echo ""
echo -e "${GREEN}====================================================================${NC}"
echo -e "${GREEN}🎉 1-CLICK DEPLOYMENT COMPLETED SUCCESSFULLY!${NC}"
echo -e "${GREEN}====================================================================${NC}"
echo -e "Your Nexus CRM instance is now live and accessible at:"
echo -e "👉 ${CYAN}http://${SERVER_IP}/${NC}"
echo -e "👉 Backend API: ${CYAN}http://${SERVER_IP}/api/health${NC}"
echo ""
echo -e "To configure a custom domain with free SSL certificate:"
echo -e "  1. Point your domain A-record to: ${YELLOW}${SERVER_IP}${NC}"
echo -e "  2. Run: ${CYAN}certbot --nginx -d yourdomain.com${NC}"
echo "===================================================================="
