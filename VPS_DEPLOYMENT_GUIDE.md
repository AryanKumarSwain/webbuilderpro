# 🚀 Web Builder Pro - Complete VPS Deployment & Hosting Guide

This guide provides step-by-step instructions to host **Web Builder Pro** on any Linux VPS (Ubuntu 22.04 / 24.04 LTS) using **Local MySQL**, **PM2**, and **Nginx**.

---

## 📑 Table of Contents
1. [VPS Prerequisites](#1-vps-prerequisites)
2. [Step 1: Install Node.js, PM2, Nginx, and MySQL](#step-1-install-system-dependencies)
3. [Step 2: Set Up VPS MySQL Database](#step-2-set-up-vps-mysql-database)
4. [Step 3: Deploy Project Files](#step-3-deploy-project-files)
5. [Step 4: Configure Environment Variables](#step-4-configure-environment-variables)
6. [Step 5: Install Packages & Build Frontend](#step-5-install-packages--build-frontend)
7. [Step 6: Start Backend with PM2](#step-6-start-backend-with-pm2)
8. [Step 7: Configure Nginx Reverse Proxy](#step-7-configure-nginx-reverse-proxy)
9. [Step 8: Set Up Free SSL with Let's Encrypt (Certbot)](#step-8-set-up-free-ssl)
10. [Updating Code on VPS (Continuous Deployment)](#updating-code-on-vps)
11. [Alternative: Docker Compose Deployment](#alternative-docker-compose-deployment)

---

## 1. VPS Prerequisites
- A VPS running **Ubuntu 22.04 or 24.04 LTS** (DigitalOcean, Hetzner, AWS EC2, Contabo, Hostinger, etc.)
- Recommended specs: **2 GB RAM or more**, **1-2 vCPU**
- Root or `sudo` access via SSH
- A domain name (e.g., `yourdomain.com`) pointed to your VPS IP:
  - `A` record: `@` -> `YOUR_VPS_IP`
  - `A` record: `*` (wildcard for school subdomains) -> `YOUR_VPS_IP`

---

## Step 1: Install System Dependencies

Connect to your VPS via SSH:
```bash
ssh root@YOUR_VPS_IP
```

Update packages and install build tools, Git, Nginx, and MySQL:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl wget ufw nginx mysql-server certbot python3-certbot-nginx
```

Install **Node.js 20 LTS** and **PM2**:
```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
node -v # Should be v20.x.x
```

Enable Firewall:
```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

---

## Step 2: Set Up VPS MySQL Database

Secure your MySQL installation:
```bash
sudo mysql_secure_installation
```

Log in to MySQL root prompt:
```bash
sudo mysql
```

Run these SQL commands inside MySQL to create the database, user, and privileges:
```sql
CREATE DATABASE IF NOT EXISTS db_school_saas CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Replace 'YourStrongPassword123!' with a secure password:
CREATE USER IF NOT EXISTS 'wbpro_user'@'localhost' IDENTIFIED WITH mysql_native_password BY 'YourStrongPassword123!';
GRANT ALL PRIVILEGES ON db_school_saas.* TO 'wbpro_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Import the Complete Database Dump
A complete database dump containing all 14 tables and initial data was exported to `database/vps_full_db_dump.sql`.

Import it directly into MySQL:
```bash
mysql -u wbpro_user -p db_school_saas < /var/www/web-builder-pro/database/vps_full_db_dump.sql
```
*(Enter the password you created above).*

---

## Step 3: Deploy Project Files

Recommended location: `/var/www/web-builder-pro`.

Clone or upload your repository:
```bash
sudo mkdir -p /var/www/web-builder-pro
sudo chown -R $USER:$USER /var/www/web-builder-pro
git clone <YOUR_GIT_REPO_URL> /var/www/web-builder-pro
cd /var/www/web-builder-pro
```

---

## Step 4: Configure Environment Variables

### 1. Backend Configuration (`backend/.env`)
Edit `backend/.env`:
```bash
nano /var/www/web-builder-pro/backend/.env
```

Ensure the following values are set:
```env
PORT=5000
NODE_ENV=production

# Database (VPS Local MySQL)
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=wbpro_user
DB_PASSWORD=YourStrongPassword123!
DB_NAME=db_school_saas

# LEAVE DB_SSL_CA_PATH UNSET / COMMENTED OUT for VPS MySQL:
# DB_SSL_CA_PATH=ca.pem

# JWT Secrets (Pre-generated secure random keys)
JWT_ACCESS_SECRET=6b443dfdd90bf3bc6c71d5ee684719724a9d92710434efe1d42e7398d793d3e9
JWT_REFRESH_SECRET=d39f64cc525d455c1a23ea2167044f26137b2c70dd0d00bce8730a02af8e68ce
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d

# Cloudinary (Get from cloudinary.com/console)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Frontend URL (Used for CORS and auth reset links)
FRONTEND_URL=https://yourdomain.com

# Resend Email (For password resets & verification OTPs)
RESEND_API_KEY=your_resend_api_key

# Razorpay (Optional - for subscription plans)
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
RAZORPAY_WEBHOOK_SECRET=
```

### 2. Frontend Configuration (`frontend/.env`)
Edit `frontend/.env`:
```bash
nano /var/www/web-builder-pro/frontend/.env
```

Set:
```env
# With Nginx reverse proxying /api to port 5000, '/api' avoids all CORS/cookie issues!
VITE_API_URL=/api

# Your primary platform domain:
VITE_PLATFORM_HOST=yourdomain.com
```

---

## Step 5: Install Packages & Build Frontend

From `/var/www/web-builder-pro`:
```bash
# Install backend dependencies
cd /var/www/web-builder-pro/backend
npm install --omit=dev

# Install frontend dependencies and build production bundle
cd /var/www/web-builder-pro/frontend
npm install
npm run build
```
*(This produces the optimized production bundle inside `frontend/dist/`).*

---

## Step 6: Start Backend with PM2

From project root `/var/www/web-builder-pro`:
```bash
# Create logs directory
mkdir -p backend/logs

# Start with PM2
pm2 start ecosystem.config.cjs

# Make PM2 restart automatically on server reboot:
pm2 startup
# (Run the sudo env PATH... command that PM2 prints out)
pm2 save
```

Verify backend is running:
```bash
pm2 status
curl http://127.0.0.1:5000/api/health
# Response: {"status":"ok", ...}
```

---

## Step 7: Configure Nginx Reverse Proxy

Copy the pre-configured Nginx config:
```bash
sudo cp /var/www/web-builder-pro/nginx/web-builder-pro.conf /etc/nginx/sites-available/web-builder-pro
```

Edit the file to put your domain name:
```bash
sudo nano /etc/nginx/sites-available/web-builder-pro
```
Change `server_name _;` to:
```nginx
server_name yourdomain.com *.yourdomain.com;
```

Enable the site and disable default site:
```bash
sudo ln -s /etc/nginx/sites-available/web-builder-pro /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

---

## Step 8: Set Up Free SSL

Run Certbot to automatically configure SSL:
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

To support school subdomains (`*.yourdomain.com`), run DNS-based wildcard validation:
```bash
sudo certbot certonly --manual --preferred-challenges dns -d "yourdomain.com" -d "*.yourdomain.com"
```

---

## Updating Code on VPS

Whenever you push new code to Git, run the automated deployment script:
```bash
cd /var/www/web-builder-pro
chmod +x deploy.sh
./deploy.sh
```

---

## Useful Maintenance Commands

| Task | Command |
|---|---|
| Check backend logs | `pm2 logs web-builder-pro-backend` |
| Restart backend | `pm2 restart web-builder-pro-backend` |
| Check Nginx status | `sudo systemctl status nginx` |
| Test Nginx config | `sudo nginx -t` |
| Reload Nginx | `sudo systemctl reload nginx` |
| View Nginx error logs | `sudo tail -f /var/log/nginx/error.log` |
| MySQL console | `mysql -u wbpro_user -p db_school_saas` |

---

## Alternative: Docker Compose Deployment

If you prefer Docker:
1. Install Docker & Docker Compose:
   ```bash
   curl -fsSL https://get.docker.com | sh
   sudo usermod -aG docker $USER
   ```
2. Set your environment variables in `.env`
3. Run:
   ```bash
   docker compose up -d --build
   ```
