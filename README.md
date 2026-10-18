# Compliance & Risk Intelligence Platform (Frontend)

Enterprise Compliance, AML (Anti-Money Laundering), Customer Risk Assessment, KYC, and Watchlist Management System built with **Next.js 16 (Turbopack)**, **React 19**, **Tailwind CSS v4**, and **Yarn 4 (Berry)**.

---

## 📑 Table of Contents

- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start Guide](#-quick-start-guide)
  - [1. Configure Environment Variables](#1-configure-environment-variables)
  - [2. Install Dependencies](#2-install-dependencies)
  - [3. Run Development Server](#3-run-development-server)
- [Authentication & Access](#-authentication--access)
  - [Connecting to Backend](#connecting-to-a-live-backend)
  - [Dev Preview / UI Bypass (No Backend)](#local-ui-preview--dev-bypass-no-backend)
- [Multi-Tenancy & User Types](#-multi-tenancy--user-types)
- [Available Scripts](#-available-scripts)
- [Environment Variables Reference](#-environment-variables-reference)
- [Project Structure](#-project-structure)
- [Comprehensive Features & Modules Guide](#-comprehensive-features--modules-guide)
  - [1. Dashboard Overview](#1-dashboard-overview-)
  - [2. Case Management](#2-case-management-cases)
  - [3. Customer Risk Profiles](#3-customer-risk-profiles-customer-risk)
  - [4. KYC Verification & Ingestion](#4-kyc-verification--ingestion-kyc)
  - [5. Geolocation Intelligence & Geofencing](#5-geolocation-intelligence--geofencing-geolocation)
  - [6. Watchlist Screening & Sanctions](#6-watchlist-screening--sanctions-watchlist)
  - [7. Tenant Management](#7-tenant-management-tenants)
  - [8. System Configuration & User RBAC](#8-system-configuration--user-rbac-config--roles)
  - [9. Notifications & Alert Center](#9-notifications--alert-center-notifications)
  - [10. Profile & Security Settings](#10-profile--security-settings-profile-settings)
  - [11. Compliance AI Assistant](#11-compliance-ai-assistant-chatbubble)
  - [12. Public KYC Onboarding](#12-public-kyc-onboarding-kyc-submit)
- [Troubleshooting & FAQ](#-troubleshooting--faq)

---

## 💻 Tech Stack

- **Framework**: Next.js 16.1 (App Router + Turbopack)
- **UI & State**: React 19, Radix UI Primitives, Ant Design, Lucide Icons
- **Styling**: Tailwind CSS v4, PostCSS, tw-animate-css
- **Forms & Validation**: React Hook Form, Zod
- **Data Fetching**: Axios, TanStack React Query v5
- **Maps & Geo**: Leaflet & React Leaflet
- **Package Manager**: Yarn 4.6.0 (Berry) with `node-modules` linker

---

## 📋 Prerequisites

Before setting up the project, ensure you have:
- **Node.js**: v20.x or v22.x (Recommended: LTS `v22.16.0` or higher)
- **Corepack**: Bundled with Node.js to manage Yarn Berry versions (`corepack -v`)

---

## 🚀 Quick Start Guide

### 1. Configure Environment Variables

Create your local environment configuration by copying `.env.example`:

```bash
# Windows PowerShell
Copy-Item .env.example .env.local

# Linux / macOS / Git Bash
cp .env.example .env.local
```

### 2. Install Dependencies

This repository uses **Yarn Berry (v4)**. Run the install command via Corepack:

#### Windows (PowerShell / Command Prompt):
```powershell
corepack.cmd yarn install
```

> **Windows PowerShell Note:** If you see the error `cannot be loaded because running scripts is disabled on this system`, use `corepack.cmd yarn` instead of `yarn`, or run:
> ```powershell
> Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
> ```

#### Linux / macOS:
```bash
corepack yarn install
```

### 3. Run Development Server

Start the development server with Next.js Turbopack:

#### Windows:
```powershell
corepack.cmd yarn dev
```

#### Linux / macOS:
```bash
corepack yarn dev
```

The application will be accessible at:
- **Dashboard / Home**: [http://localhost:3000](http://localhost:3000)
- **Login Portal**: [http://localhost:3000/login](http://localhost:3000/login)

---

## 🔐 Authentication & Access

All dashboard routes (`/`, `/cases`, `/kyc`, `/customer-risk`, `/tenants`, etc.) are protected by Next.js middleware in `proxy.ts`, which checks for a valid `accessToken` cookie.

### Connecting to a Live Backend
If your compliance backend API is running (locally or remotely):
1. In `.env.local`, set:
   ```env
   NEXT_PUBLIC_BASE_URL=http://localhost:8000
   ```
2. Navigate to [http://localhost:3000/login](http://localhost:3000/login) and log in with your registered credentials.
3. The app supports Multi-Factor Authentication (MFA via TOTP or Email) and Device Fingerprint Verification.

### Local UI Preview / Dev Bypass (No Backend)
If the backend API is not available and you need to view or develop the dashboard UI immediately:

1. Open [http://localhost:3000/login](http://localhost:3000/login) in your browser.
2. Press `F12` to open Developer Tools and select the **Console** tab.
3. Paste the following script and press `Enter`:
   ```javascript
   document.cookie = "accessToken=dev-token; path=/";
   document.cookie = "X-User-Type=tenant; path=/";
   localStorage.setItem("user", JSON.stringify({
     id: "dev-admin-id",
     tenant_id: "default-tenant",
     email: "admin@compliance.local",
     full_name: "Compliance Officer",
     phone: "+1234567890",
     role_id: "admin-role",
     role_name: "Administrator",
     status: "active",
     risk_level: "low",
     user_type: "tenant"
   }));
   localStorage.setItem("devUserType", "tenant");
   window.location.href = "/";
   ```
4. You will be redirected directly into the dashboard.

---

## 🏢 Multi-Tenancy & User Types

The application architecture supports multi-tenant isolation and system administrator consoles:

- **System Users (`system`)**: System administrators managing across multiple tenants (`console.domain.com` or `devUserType = 'system'`).
- **Tenant Users (`tenant`)**: Organizations and team members confined to their specific tenant (`tenant.domain.com` or `devUserType = 'tenant'`).
- **Development Mode Override**: When developing on `localhost`, switch user context in browser storage:
  ```javascript
  localStorage.setItem('devUserType', 'system'); // or 'tenant'
  ```

---

## 🛠 Available Scripts

| Command | Description |
|---|---|
| `corepack.cmd yarn dev` | Starts local Next.js development server with Turbopack |
| `corepack.cmd yarn build` | Generates optimized production build |
| `corepack.cmd yarn start` | Starts production server |
| `corepack.cmd yarn type-check` | Runs TypeScript compiler checks without emitting files (`tsc --noEmit`) |
| `corepack.cmd yarn lint` | Runs ESLint analysis across the project |

---

## ⚙️ Environment Variables Reference

| Variable | Required | Default | Description |
|---|---|---|---|
| `NEXT_PUBLIC_BASE_URL` | **Yes** | `http://localhost:8000` | Base URL of the Compliance REST API Gateway |
| `NEXT_PUBLIC_TENANT_ID` | Optional | `""` | Default Tenant ID fallback for multi-tenant requests |
| `AUTH_SECRET` | **Yes** | — | Secret string used for auth token hashing and session integrity |
| `AUTH_URL` | **Yes** | `http://localhost:3000` | Application host origin |
| `PORT` | Optional | `3000` | Port for the Next.js server |

---

## 📁 Project Structure

```text
├── actions/             # API client actions (auth, cases, kyc, customer-risk, tenants, etc.)
├── app/                 # Next.js App Router
│   ├── (auth)/          # Authentication routes (login, register, mfa, forgot-password)
│   ├── (dashboard)/     # Authenticated dashboard views (cases, kyc, risk, roles, config)
│   ├── (public)/        # Publicly accessible pages
│   ├── globals.css      # Core styles & Tailwind CSS tokens
│   └── layout.tsx       # Root HTML & theme providers
├── components/          # Reusable UI & domain components
│   ├── chat/            # Compliance AI Assistant chat bubble & interface
│   ├── dashboard/       # Dashboard widgets, metric cards, charts
│   ├── layout/          # AppHeader, Sidebar, TenantSelector, Navigation
│   └── providers/       # AuthProvider, TenantProvider, NotificationProvider
├── constants/           # Global application constants, icons, routes, navigation
├── hooks/               # Custom React hooks (debounce, notifications, inactivity logout)
├── lib/                 # Utility libraries and notification routing configurations
├── proxy.ts             # Route protection middleware (intercepts unauthenticated visits)
├── types/               # TypeScript interfaces & API contract definitions
├── utils/               # Axios instances, cookie helpers, formatting, device fingerprinting
└── public/              # Static SVG logos, assets, and icons
```

---

## 🔍 Comprehensive Features & Modules Guide

### 1. Dashboard Overview (`/`)
Centralized intelligence hub providing high-level operational visibility:
- **Executive KPIs**: Real-time counters for active cases, pending alerts, high-risk customers, KYC reviews required, and watchlist matches.
- **Trend Visualizations**: Fraud velocity charts, daily transaction volume anomalies, and risk distribution graphs.
- **Recent Activity Feed**: Live audit stream tracking user actions, flag evaluations, and system events.
- **Quick Actions**: Direct jump shortcuts to create cases, review high-priority KYC requests, or investigate suspicious transactions.

---

### 2. Case Management (`/cases`)
End-to-end incident management and regulatory investigation workflow:
- **Case Roster (`/cases`)**: Multi-column sorting and filtering by priority (`Low`, `Medium`, `High`, `Critical`), investigation status (`Open`, `Under Investigation`, `Escalated`, `Resolved`, `Closed`), assigned investigator, and date ranges.
- **Case Details & Investigation View (`/cases/[id]`)**:
  - **Case Summary & Timeline**: Narrative notes, timeline of events, and tagged entities.
  - **Activity Stream (`/cases/[id]/activity`)**: Chronological audit trail of all investigator notes, state transitions, and attachments.
  - **Evidence Requests (`/cases/[id]/evidence-requests`)**: Formal evidence collection tracking sent to customers or internal teams.
  - **Evidence Upload Portal (`/[tenant_id]/cases/[id]/evidences/[evidenceId]/upload`)**: Secure file ingestion for documents, transaction logs, and external reports.
- **Workflows**: Reassign cases, change priority, escalate to Senior Compliance Officers, and export complete case dossiers.

---

### 3. Customer Risk Profiles (`/customer-risk`)
Comprehensive AML risk profiling and behavioral analysis:
- **Customer Risk Table (`/customer-risk`)**: Overview of all onboarded customers with dynamic composite risk scoring (Low, Medium, High, Critical) and risk tags (PEP, High Velocity, Sanction Near-Match).
- **Customer Dossier (`/customer-risk/[id]`)**:
  - **Risk Factors (`/customer-risk/[id]/risk-factors`)**: Granular breakdown of individual risk metrics (jurisdiction score, onboarding risk, velocity multiplier, SAR filing history).
  - **Transaction History (`/customer-risk/[id]/transactions`)**: Detailed ledger of deposits, withdrawals, transfers, and anomalous velocity indicators.
  - **Location History (`/customer-risk/[id]/location-history`)**: Geo-IP footprint mapping connection points, IP addresses, ISP information, and travel consistency.
  - **Login & Device Activity (`/customer-risk/[id]/login-activity`)**: Device fingerprinting history, browser fingerprints, operating systems, and suspicious credential usage.

---

### 4. KYC Verification & Ingestion (`/kyc`)
Identity verification and document validation lifecycle:
- **KYC Master View (`/kyc` and `/kyc/[recordId]`)**: Comprehensive records of all customer identity verification files, applicant details, submission dates, and verification outcomes.
- **KYC Alerts Queue (`/kyc/alerts` and `/kyc/alerts/[recordId]`)**: Dedicated queue for identity exceptions, including expired documents, facial recognition mismatches, and tampered ID warnings.
- **Staff Submission Flow (`/kyc/submit`)**: Internal submission portal for operators to upload identification documents on behalf of customers.

---

### 5. Geolocation Intelligence & Geofencing (`/geolocation`)
Location-based compliance verification and anomaly detection:
- **Interactive Geo Visualizations (`/geolocation/geo-visuals`)**: Leaflet-powered maps rendering real-time user clusters, transaction origins, and active geo-alerts.
- **Geolocation Alerts (`/geolocation/alerts` and `/geolocation/alerts/[id]`)**: Automated detection for:
  - *Impossible Travel*: Geographically incompatible connections detected within short timeframes.
  - *VPN / Proxy / Tor Detection*: Flagging obfuscated IP addresses.
  - *Sanctioned Region Breaches*: Prohibited connection attempts from sanctioned jurisdictions.
- **Jurisdictions & Geofence Rules (`/geolocation/jurisdictions`)**:
  - Define custom polygon geofences and restricted country/state jurisdictions.
  - Configure automated enforcement rules (e.g., auto-freeze account, flag for manual review, require step-up MFA).
- **Geolocation Audit Logs (`/geolocation/audit-logs`)**: Searchable log of every geolocation evaluation event.

---

### 6. Watchlist Screening & Sanctions (`/watchlist`)
Screening against international financial crime databases:
- **Screening Queue (`/watchlist`)**: Automated batch and real-time screening of applicants and transactions against global sanctions (OFAC, EU, UN, HMT) and PEP registers.
- **Match Investigation (`/watchlist/screening/[id]` and `/watchlist/screening/matches/[id]`)**:
  - Side-by-side comparison of customer identity attributes vs. sanction record.
  - Fuzzy-match similarity score calculation.
  - Adjudication options: Mark as *False Positive* (with justification) or *True Match* (auto-escalates to SAR workflow).
- **Internal Watchlists (`/watchlist/internal` and `/watchlist/internal/[id]`)**:
  - Manage company-specific exclusion lists, known fraudsters, and blocked wallets/bank accounts.
  - Add new internal entities with custom risk tags and expiry dates.

---

### 7. Tenant Management (`/tenants`)
Multi-tenant architecture management (available for platform administrators):
- **All Tenants Directory (`/tenants` and `/tenants/[id]`)**: Status, active user counts, licensing tiers, and API quota monitoring for each organization.
- **Tenant Creation & Configuration (`/tenants/add`, `/tenants/[id]/edit`)**: Onboard new organization instances, assign custom subdomains, configure compliance feature suites.
- **Dynamic Tenant Switcher (`TenantSelector`)**: Header-level dropdown allowing system administrators to toggle context between different client tenants effortlessly.

---

### 8. System Configuration & User RBAC (`/config` & `/roles`)
Administrative control center and privilege enforcement:
- **System Configuration (`/config`)**:
  - Global risk scoring thresholds and AML rule weighting.
  - Email notification and webhook dispatch settings.
  - GPT AI query enablement toggles (`enable_gpt_query`).
- **User Management (`/config/add-user`, `/config/edit-user/[id]`, `/users/[id]` / `/users/[id]/edit`)**:
  - Invite, manage, deactivate, and unlock compliance officer user accounts.
  - Department and tenant assignment.
- **Role-Based Access Control (`/roles`, `/roles/create`, `/roles/[id]`, `/roles/hierarchy`)**:
  - Create and structure user roles (Super Admin, Senior Investigator, Junior Analyst, Auditor).
  - Role hierarchy tree visualization.
  - Granular matrix privileges per resource: `get`, `create`, `update`, `delete`, `approve`, `export`, `escalate`, `query`.

---

### 9. Notifications & Alert Center (`/notifications`)
Centralized real-time notification engine:
- Filter notifications by unread status, alert category, and urgency.
- Real-time notification badge in the header with sound/toast alerts.
- Single-click deep linking: clicking an alert directly opens the relevant case, customer dossier, or KYC exception.
- Bulk operations: Mark individual or all notifications as read.

---

### 10. Profile & Security Settings (`/profile-settings`)
User-level security and preference management:
- **Personal Information**: Name, contact phone number, email, and avatar photo uploads.
- **Security & Authentication**:
  - Password updates with strength validation.
  - Multi-Factor Authentication (MFA) setup with QR code TOTP (Google Authenticator) or Email OTP.
  - Inactivity timeout safeguards (auto-logout protection).

---

### 11. Compliance AI Assistant (`ChatBubble`)
Intelligent compliance copilot embedded into the bottom corner of every page:
- Powered by LLM integration to assist compliance analysts during investigations.
- Summarize complex customer transaction patterns and anomalous activity.
- Query AML regulations, KYC validation guidelines, and internal compliance policy manuals.
- Can be enabled or disabled per tenant via system settings.

---

### 12. Public KYC Onboarding (`/kyc-submit`)
Clean, customer-facing onboarding interface:
- Responsive, mobile-friendly identity capture flow.
- Upload front and back of national identity cards, passports, or driver's licenses.
- Submits directly into the compliance system's verification engine without requiring internal system authentication.

---

## ❓ Troubleshooting & FAQ

#### 1. PowerShell: "Running scripts is disabled on this system"
Run commands using the `.cmd` wrapper:
```powershell
corepack.cmd yarn <command>
```
Or allow script execution for your current session:
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

#### 2. "Cannot find module ... public/logo.svg"
Static assets in the `public/` directory should be referenced by URL string (e.g., `<Image src="/logo.svg" ... />`) rather than imported directly as a TypeScript module.

#### 3. CORS or Server Actions origin warning
Add your host or test domain to `experimental.serverActions.allowedOrigins` in `next.config.ts`.
