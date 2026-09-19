#!/bin/bash
# ═════════════════════════════════════════════════════════════════
# Web Builder Pro - Production VPS Update & Deployment Script
# Run on VPS whenever you push changes to main:
#   chmod +x deploy.sh
#   ./deploy.sh
# ═════════════════════════════════════════════════════════════════

set -e

echo "🚀 Starting deployment for Web Builder Pro..."

# 1. Pull latest code from Git
if [ -d ".git" ]; then
    echo "📥 Pulling latest git commits..."
    git pull origin main
else
    echo "ℹ️  No git repository found; skipping git pull."
fi

# 2. Install backend dependencies
echo "📦 Installing backend packages..."
cd backend
npm install --omit=dev
cd ..

# 3. Install frontend dependencies and build
echo "⚛️  Installing frontend packages and building static assets..."
cd frontend
npm install
npm run build
cd ..

# 4. Restart backend via PM2
echo "🔄 Reloading PM2 backend process..."
if command -v pm2 &> /dev/null; then
    pm2 reload ecosystem.config.cjs || pm2 start ecosystem.config.cjs
    pm2 save
else
    echo "⚠️  PM2 is not installed globally. Run: sudo npm install -g pm2"
fi

# 5. Reload Nginx (if available and sudo permitted)
if command -v nginx &> /dev/null; then
    echo "🌐 Reloading Nginx configuration..."
    sudo nginx -t && sudo systemctl reload nginx || true
fi

echo "✅ Web Builder Pro deployed successfully!"
