# 🎓 Nexus Institute of Technology — Edu-Business Operations & CRM Suite

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-20.x%20LTS-green)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19.x-blue)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)](https://www.typescriptlang.org)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8)](https://tailwindcss.com)
[![Express](https://img.shields.io/badge/Express-5.x-lightgrey)](https://expressjs.com)
[![Recharts](https://img.shields.io/badge/Recharts-3.x-22c55e)](https://recharts.org)

A production full-stack Edu-Business Operations & CRM platform engineered for technology institutes, coding academies, and corporate training hubs. Featuring strict **Nigerian Naira (`₦`) localization**, Nigerian Corporate Affairs Commission (**CAC**) & **TIN** tax compliance, Access Bank **NIBSS electronic settlement**, role-based privacy security, interactive **Recharts analytics**, live notification feeds, and a full-stack **Node/Express REST API backend**.

---

## ⚡ 1-Click Installation & Deployment Tools

You can deploy the entire full-stack system with a single command or one click using any of the options below:

### 🚀 1. One-Command Automated VPS Deployment (Hostinger / Ubuntu VPS)
On any fresh Ubuntu 20.04 / 22.04 / 24.04 VPS (e.g. Hostinger VPS), run this single command as root:

```bash
curl -sSL https://raw.githubusercontent.com/eskay243/educate-crm/main/deploy.sh | sudo bash
```

**What the automated script handles automatically:**
1. Installs Node.js 20 LTS, Nginx, PM2, and UFW firewall.
2. Clones the latest code from GitHub and builds the frontend bundle.
3. Configures and starts the Express backend API on PM2 with auto-restart on boot.
4. Auto-configures Nginx reverse proxy to serve the frontend and proxy `/api/*` requests.
5. Enables firewall rules and outputs your live public server IP.

---

### 🐳 2. One-Command Docker Container Deployment
If you have Docker installed on your VPS or local machine:

```bash
# Clone and start with Docker Compose in 1 command
git clone https://github.com/eskay243/educate-crm.git
cd educate-crm
docker compose up -d --build
```
- App will be live at `http://localhost:5001/` with volume-backed persistence for `server/data/`.

---

### ☁️ 3. One-Click Cloud Platform Deployments

| Platform | Deployment Method | Config File |
| :--- | :--- | :--- |
| **Hostinger VPS** | `curl -sSL .../deploy.sh \| sudo bash` | [`deploy.sh`](./deploy.sh) |
| **Docker** | `docker compose up -d --build` | [`docker-compose.yml`](./docker-compose.yml) |
| **Render** | Blueprint Deploy | [`render.yaml`](./render.yaml) |
| **Vercel** | One-Click SPA Import | [`vercel.json`](./vercel.json) |

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
