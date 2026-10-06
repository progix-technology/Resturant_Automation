# 🍽️ OrderFlow - Multi-Tenant Restaurant QR Ordering & Automation SaaS

[![Node.js](https://img.shields.io/badge/Node.js-v18+-green.svg)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-v18-blue.svg)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-v4-black.svg)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-emerald.svg)](https://www.mongodb.com/)
[![Baileys WhatsApp](https://img.shields.io/badge/WhatsApp-Baileys%20Engine-25D366.svg)](https://github.com/WhiskeySockets/Baileys)
[![License](https://img.shields.io/badge/License-MIT-purple.svg)](LICENSE)

**OrderFlow** is a modern, high-performance, multi-tenant SaaS platform for restaurant QR code ordering, table management, automatic WhatsApp dispatch, and dynamic exact-amount NPCI UPI payments.

---

## 🔥 Key Features & Capabilities

### 📱 1. Mobile-First Customer QR Dining Journey
- **Table-Bound QR Scanning**: Instant welcome page & menu tailored per table number and restaurant slug (`/menu/:restaurantSlug`).
- **Real-Time Interactive Menu**: Category filters, veg/non-veg tags, spice indicators, food descriptions, and instant cart synchronization.
- **Dynamic Billing & Taxes**: Automatic GST calculations and real-time order tracking.

### 🤖 2. 100% Free Automated WhatsApp Background Engine
- **Powered by `@whiskeysockets/baileys`**: No official Meta paid API fees or third-party WhatsApp charges required.
- **8-Digit Pairing Code / QR Link**: Admins can pair their official restaurant WhatsApp number directly from the Admin Dashboard.
- **Zero-Click Background Dispatches**: Automated order receipts, kitchen ETAs, food ready notifications, and payment requests sent silently to diners.
- **Multi-Tenant Session Isolation**: Each restaurant maintains its own encrypted session folder (`backend/src/data/tenants/<slug>/whatsapp_auth/`).

### 💳 3. Exact-Amount Dynamic NPCI UPI QR & 1-Tap Pay
- **NPCI Standard Auto-Amount**: Generates `upi://pay?pa=...&am=599...` QR codes.
- **Zero Typing for Customers**: Scanning with Google Pay, PhonePe, Paytm, or BHIM **automatically pre-fills the exact bill amount** (e.g. ₹599).
- **Direct Bank Settlement (0% Gateway Commission)**: Payments land directly in each restaurant's individual bank account.

### 🔒 4. Advanced 2-Step Security Lock (2FA)
- **Admin Password Verification**: Protects sensitive changes to UPI VPAs, Bank Settlement Details, and WhatsApp Login credentials.
- **6-Digit WhatsApp Security OTP**: Dispatches a confidential 6-digit verification code directly to the restaurant's paired WhatsApp mobile device (`/api/whatsapp/send-security-otp`).

### 🏢 5. Multi-Tenant SaaS Platform & Admin Architecture
- **SuperAdmin Portal**: Manage platform subscriptions, tenant restaurants, monthly GMVs, and invoices.
- **Restaurant Admin Portal**: Real-time order kitchen display system (KDS), table management, menu catalog editor, and settings.
- **Role-Based Access Control**: SuperAdmin, Admin, and Staff user roles.

---

## 🏗️ Project Architecture

```
Resturent_Order_Booking_System/
├── backend/
│   ├── src/
│   │   ├── config/          # Database & Cloudinary configurations
│   │   ├── controllers/     # Auth, Order, Menu, WhatsApp, Settings controllers
│   │   ├── data/            # Multi-tenant isolated storage per restaurant slug
│   │   ├── middleware/      # JWT auth, Rate limiters, Security guards
│   │   ├── models/          # Mongoose & JSON schema models
│   │   ├── routes/          # Express API route declarations
│   │   ├── services/        # Baileys WhatsApp background engine
│   │   └── server.js        # Express application entry point
│   ├── .env.example         # Backend environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── admin/           # Restaurant Admin Dashboard UI & Context
│   │   ├── components/      # UI components (PaymentQRCode, Modals, Headers)
│   │   ├── context/         # Customer Cart, Session, Order state providers
│   │   ├── pages/           # Customer mobile QR pages (Menu, Cart, Payment)
│   │   ├── routes/          # AppRoutes with React.lazy() & Suspense
│   │   ├── services/        # Notification & API client services
│   │   └── superadmin/      # SaaS SuperAdmin Executive Portal
│   ├── vercel.json          # Vercel SPA deployment configuration
│   ├── .env.example         # Frontend environment variables template
│   └── package.json
├── render.yaml              # Render backend deployment configuration
├── vercel.json              # Root monorepo deployment configuration
└── .gitignore               # Comprehensive security gitignore
```

---

## ⚡ Quick Start & Local Setup

### Prerequisites
- **Node.js**: `v18.0.0` or higher
- **npm**: `v9.0.0` or higher

### 1. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file inside `backend/` based on `.env.example`:
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your_secure_jwt_secret_key_2026
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173

# MongoDB Atlas
MONGODB_URI=your_mongodb_connection_string

# Cloudinary Storage
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

Start backend development server:
```bash
npm run dev
```
Backend will start on `http://localhost:5000`.

### 2. Frontend Setup
```bash
cd frontend
npm install
```

Create a `.env` file inside `frontend/` based on `.env.example`:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start frontend development server:
```bash
npm run dev
```
Frontend will start on `http://localhost:5173`.

---

## 🚀 Deployment Guide

### Frontend Deployment (Vercel)
1. Push repository to GitHub.
2. Log into [Vercel](https://vercel.com/) and create a **New Project**.
3. Select the repository and configure:
   - **Framework Preset**: `Vite`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Add Environment Variable:
   - `VITE_API_BASE_URL`: `https://your-backend-service.onrender.com/api`
5. Click **Deploy**.

### Backend Deployment (Render / Railway)
1. Log into [Render](https://render.com/) and create a **New Web Service**.
2. Select the repository and configure:
   - **Environment**: `Node`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
3. Add Environment Variables from `backend/.env.example`.
4. Click **Create Web Service**.

---

## 🛡️ Security Features

- **Password Hashing**: `bcryptjs` with 10 salt rounds applied on all user credentials.
- **Brute-Force Rate Limiting**: `express-rate-limit` active on login, password verification, and WhatsApp OTP endpoints.
- **Confidential Environment Variables**: `.gitignore` strictly ignores `.env` files, WhatsApp auth sessions, and database dumps.
- **Zero-Trust 2FA**: Settings changes require active Admin Password + 6-Digit WhatsApp OTP.

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for details.

Developed with ❤️ by **Progix Technology**.
