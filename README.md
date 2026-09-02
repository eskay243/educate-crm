# 🎓 Nexus Institute of Technology — Edu-Business Operations & CRM Suite

![Node.js](https://img.shields.io/badge/Node.js-20.x-green)
![React](https://img.shields.io/badge/React-19.x-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)
![Express](https://img.shields.io/badge/Express-5.x-lightgrey)
![Recharts](https://img.shields.io/badge/Recharts-3.x-22c55e)
![License](https://img.shields.io/badge/License-MIT-yellow)

A full-stack, enterprise-grade Edu-Business Operations & CRM platform designed specifically for managing accelerated technology education academies, executive bootcamps, and corporate training hubs. Built with strict Nigerian commercial localization (Naira `₦`, CAC RC compliance, NIBSS electronic transfers), role-based privacy controls, interactive Recharts analytics, and real-time event automations.

---

## 🌟 Key Features & Capabilities

### 1. 🔐 Role-Based Access Control (RBAC) & Privacy
- **4 Persona Access Levels**:
  - `super_admin`: Managing Director with unrestricted access, curriculum editing, mentor recruitment, and **Staff Role Provisioning & Reassignment**.
  - `admissions`: Head of Admissions managing lead pipelines, Kanban stages, and student conversions.
  - `mentor`: Faculty Mentor portal with **Strict Financial Masking** (cannot view student payment ledgers or other mentors' honorarium rates) and co-faculty network filtering.
  - `finance`: Account Officer / CFO managing student billing schedules, payment installment due dates, 1-click **Automated Payment Reminders** (Access Bank NUBAN `0812948192`), and expense disbursements.

### 2. 📊 Advanced Interactive Analytics (Recharts)
- **Revenue vs. Costs Multi-Bar Chart**: Monthly comparison of Gross Tuition (₦), Faculty Honorariums (₦), and Operating Costs (₦) with dynamic net profit margin tooltips.
- **Lead Acquisition Donut Chart**: Animated channel breakdown (Lagos FinTech Week, Corporate Referrals, LinkedIn Ads, Alumni Network, Webinars) with total pipeline valuation in `₦`.
- **Cohort Retention & Placement Area Chart**: Tracks enrollment vs 92.3% Nigerian tech job placement rate across quarterly batches.
- **Department Unit Economics Chart**: Horizontal profitability bar comparison across academic tracks.

### 3. 🔔 Real-Time Automations & Notification Center
- **In-App Notification Drawer**: Live unread badge counter, category channel filtering (*All*, *Admissions*, *Finance*, *Mentorship*), relative timestamps, and 1-click record navigation.
- **Transient Action Toasts**: Bottom-right notifications for immediate feedback on key operations.
- **Event-Driven Triggers**: Automated tuition invoice generation upon lead conversion, payment due date alerts, and mentor honorarium credits.

### 4. 🚀 Full-Stack Backend API & Database
- **Express REST API Server**: Fast Node/Express backend running on port `5001` with JSON file persistence (`server/data/db.json`).
- **Asynchronous Service Client**: Frontend `apiService` with optimistic UI updates and zero-downtime offline fallback.

---

## 📁 Repository Structure

```text
educate-crm/
├── server/
│   ├── data/
│   │   └── db.json               # Persistent JSON database (auto-seeded)
│   └── server.ts                 # Express REST API backend server
├── src/
│   ├── components/
│   │   ├── analytics/            # Recharts data visualization components
│   │   ├── auth/                 # ProtectedRoute guard components
│   │   ├── layout/               # Sidebar, TopNavbar, AppLayout
│   │   ├── modals/               # Course, Mentor, Lead, Expense, Invoice modals
│   │   └── notifications/        # NotificationDrawer, ToastContainer
│   ├── context/
│   │   └── CRMContext.tsx        # Global state provider & optimistic sync
│   ├── data/
│   │   └── mockData.ts           # Nigerian demo seed dataset & schemas
│   ├── pages/                    # React page views (Executive, Leads, Students, etc.)
│   ├── services/
│   │   └── api.ts                # Type-safe frontend REST API client
│   └── types/
│       └── crm.ts                # TypeScript interfaces & domain types
├── package.json
├── PRD.md                        # Comprehensive Product Requirement Document (v3.0)
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts                # Vite config with API proxy
```

---

## 💻 Local Development Setup

### Prerequisites
- **Node.js**: v18.x or v20.x LTS (Recommended: Node 20+)
- **npm**: v9.x or v10.x
- **Git**

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/eskay243/educate-crm.git
   cd educate-crm
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start Full-Stack Development (Frontend + Backend Concurrently)**:
   ```bash
   npm run dev:full
   ```
   - **Frontend App**: `http://localhost:5173/`
   - **Backend API**: `http://localhost:5001/api/health`

4. **Alternative: Run Frontend and Backend Separately**:
   - Terminal 1 (Backend API):
     ```bash
     npm run server
     ```
   - Terminal 2 (Vite Frontend):
     ```bash
     npm run dev
     ```

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🌐 Remote Server Deployment & Migration Guide

---

### Option 1: Hostinger VPS Deployment (Ubuntu 22.04 / 24.04) — Recommended

Hostinger VPS provides cost-effective, dedicated resources ideal for running Node.js full-stack applications with high availability.

#### Step 1: Connect to your Hostinger VPS via SSH
```bash
ssh root@YOUR_HOSTINGER_VPS_IP
```

#### Step 2: System Update & Install Node.js 20 LTS
```bash
# Update package repositories
sudo apt update && sudo apt upgrade -y

# Install Git, curl, build tools, and Nginx
sudo apt install -y curl git nginx ufw build-essential

# Install Node.js 20 LTS via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify versions
node -v   # Should output v20.x
npm -v    # Should output 10.x
```

#### Step 3: Install PM2 (Process Manager) & TypeScript Execution Tools
```bash
sudo npm install -g pm2 tsx
```

#### Step 4: Clone Repository & Build Application
```bash
# Navigate to web root directory
cd /var/www

# Clone your GitHub repository
git clone https://github.com/eskay243/educate-crm.git
cd educate-crm

# Install production and development dependencies
npm install

# Build the frontend production bundle
npm run build
```

#### Step 5: Start Backend Server with PM2 Process Manager
```bash
# Start backend API with PM2 daemon
pm2 start "npx tsx server/server.ts" --name "nexus-crm-api"

# Configure PM2 to restart automatically on server reboot
pm2 startup
pm2 save
```

#### Step 6: Configure Nginx as Reverse Proxy & Static Host
Create an Nginx server block:
```bash
sudo nano /etc/nginx/sites-available/nexus-crm
```

Paste the following configuration (replace `yourdomain.com` or use your VPS IP):
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com YOUR_HOSTINGER_VPS_IP;

    # Frontend Single Page Application (SPA)
    location / {
        root /var/www/educate-crm/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Proxy API requests to Node/Express backend
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

    # Enable Gzip Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
}
```

Enable the configuration and restart Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/nexus-crm /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 7: Configure Firewall & SSL with Let's Encrypt
```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw --force enable

# (Optional) Install Free SSL Certificate with Certbot
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

---

### Option 2: Cloud PaaS Deployment (Render / Railway / DigitalOcean App Platform)

If you prefer managed cloud platforms without VPS server configuration:

1. **Frontend (Vercel / Netlify / Render Static Site)**:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
   - **Environment Variables**: `VITE_API_URL=https://your-backend-api.onrender.com`

2. **Backend API (Render Web Service / Railway)**:
   - **Build Command**: `npm install`
   - **Start Command**: `npx tsx server/server.ts`
   - **Port**: `5001` (or `$PORT`)

---

### Option 3: Docker Container Deployment

Create a `Dockerfile` for self-contained container deployments:

```dockerfile
# Build stage
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev && npm install -g tsx
COPY --from=builder /app/dist ./dist
COPY server ./server

EXPOSE 5001
CMD ["npx", "tsx", "server/server.ts"]
```

---

## 🔄 Database Migration & Backup Procedures

### 1. Data Persistence Location
The primary database file is stored at:
```text
/var/www/educate-crm/server/data/db.json
```

### 2. Automated Daily Database Backup (Hostinger VPS Cron Job)
Set up a daily backup cron job on your Hostinger VPS:
```bash
# Open crontab editor
crontab -e
```
Add the following line to back up the database daily at 2:00 AM WAT:
```bash
0 2 * * * cp /var/www/educate-crm/server/data/db.json /var/backups/nexus_crm_db_$(date +\%Y\%m\%d).json
```

### 3. Migrating Data from Local to Remote VPS
To transfer your local database records to your remote VPS:
```bash
# From your local machine:
scp server/data/db.json root@YOUR_HOSTINGER_VPS_IP:/var/www/educate-crm/server/data/db.json

# Restart PM2 on remote VPS
ssh root@YOUR_HOSTINGER_VPS_IP "pm2 restart nexus-crm-api"
```

---

## 📡 REST API Reference

| Method | Endpoint | Description | Access Role |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | Server health check & uptime status | Public |
| `GET` | `/api/bootstrap` | Fast unified bootstrap of all CRM datasets | Authenticated |
| `GET` | `/api/leads` | List all prospect leads in pipeline | `super_admin`, `admissions` |
| `POST` | `/api/leads` | Create a new lead record | `super_admin`, `admissions` |
| `PATCH` | `/api/leads/:id` | Update lead status / Kanban stage | `super_admin`, `admissions` |
| `POST` | `/api/leads/:id/convert` | Atomic lead conversion + invoice issuance | `super_admin`, `admissions` |
| `GET` | `/api/students` | List student enrollment records | All roles (Filtered) |
| `POST` | `/api/students/:id/payment-reminder` | Dispatch Nigerian payment reminder | `super_admin`, `finance` |
| `GET` | `/api/mentors` | List faculty mentor roster & hours | All roles (Masked) |
| `POST` | `/api/mentors` | Recruit a new faculty mentor | `super_admin` |
| `GET` | `/api/expenses` | List operating expenses & budgets | `super_admin`, `finance` |
| `PATCH` | `/api/expenses/:id` | Approve/Reject expense disbursement | `super_admin`, `finance` |
| `GET` | `/api/courses` | List academic tracks & curricula | All roles |
| `GET` | `/api/notifications` | Live operations alert stream | All roles |
| `POST` | `/api/reset` | Restore demo seed dataset | `super_admin` |

---

## 📄 License & Attribution
Distributed under the **MIT License**. Created for **Nexus Institute of Technology & Management** operations.
