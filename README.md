# 🍽️ Palatia — Integrated QR Self-Ordering & Real-Time Restaurant Operating System (OS)

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-24-339933?style=flat-square&logo=node.js)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express-4.19-000000?style=flat-square&logo=express)](https://expressjs.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-4.7-010101?style=flat-square&logo=socket.io)](https://socket.io/)
[![Prisma](https://img.shields.io/badge/Prisma-5.11-2D3748?style=flat-square&logo=prisma)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat-square&logo=postgresql)](https://www.postgresql.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=flat-square)](LICENSE)

> **Palatia** is a modern, full-stack, real-time restaurant operating system designed to automate guest self-ordering via table QR codes, streamline kitchen display operations (KDS), manage waiter POS billing, and automate recipe-based stockroom inventory deduction in one unified web platform.

---

## 📌 Problem Statement & Pain Points

Traditional food & beverage (F&B) operations suffer from systemic inefficiencies that erode customer experience and restaurant profitability:

| Operational Pain Point | Business Impact | How Palatia Solves It |
| :--- | :--- | :--- |
| **Long Waiter Wait Times** | Guests wait 10–15 minutes just to call a waiter for menus or billing during rush hours. | **Instant QR Table Self-Ordering:** Guests scan the table QR code, browse the digital menu, add notes, and pay immediately from their phone. |
| **Kitchen Miscommunications** | Handwritten notes and verbal orders cause item errors, missed food allergies, or misplaced special requests. | **Digital Kitchen Display System (KDS):** Orders with exact item quantities and customized customer notes appear on kitchen screens in real time. |
| **Lack of Order Visibility** | Hungry customers repeatedly ask waiters *"Is my food ready?"*, causing staff friction. | **Live Cooking Status Tracker:** Customers watch their dish progress live on their phone (Received ➔ Paid ➔ Cooking ➔ Ready ➔ Done) via WebSockets. |
| **Stock Leakage & Unmeasured Recipes** | Uncontrolled portioning leads to inconsistent dish taste across shifts and unmonitored ingredient loss. | **Controlled Inventory & Recipe Engine:** Every menu item is tied to raw ingredient weights; stock is automatically deducted upon ordering. |
| **Security & Cross-Portal Risks** | Staff members or unauthorized users accessing internal backoffice pages or customer portals. | **Isolated Surface Authorization Guards & `httpOnly` JWT:** Role-based access control protecting `/admin`, `/kitchen`, `/waiter`, and `/menu`. |

---

## 🚀 Key Modules & System Features

```mermaid
flowchart LR
    A["📱 Guest (Scan QR Meja)"] -->|Pesan & Bayar QRIS| B["⚡ Palatia Express API"]
    B -->|WebSocket Push| C["🍳 Kitchen Screen (KDS)"]
    C -->|Update: Ready| D["🤵 Waiter Tablet (POS)"]
    D -->|Antar ke Meja| E["📲 HP Customer (Status Live)"]
    B -->|Dipotong Otomatis| F["📦 Stok Bahan Baku (Gudang)"]
```

### 📱 1. Guest Self-Ordering Portal (`/menu?t=<table_token>`)
* **PWA Zero Installation:** Accessible instantly on any mobile device by scanning a table QR code.
* **Table Context Auto-Resolution:** Encrypted table tokens link guest sessions directly to their physical table number.
* **Custom Kitchen Notes & Modifiers:** Guests can add custom dish instructions (e.g., *"Extra spicy, no onions"*).
* **Multi-Channel E-Wallet Checkout:** Integrated payment modal supporting QRIS, GoPay, DANA, OVO, and BCA Virtual Account.

### ⚡ 2. Real-Time Live Order Tracker (`/track/<tracking_token>`)
* **Low-Latency Push Events:** Socket.io WebSockets update the customer's phone status instantly without manual page reloads.
* **5-Step Live Status Bar:**
  1. `Received` (Order submitted to system)
  2. `Paid` (Payment verified)
  3. `Cooking` (Chef started preparing dish in kitchen)
  4. `Ready / Served` (Food prepared and delivered to table by waiter)
  5. `Done` (Order completed)
* **Responsive Invoice Summary:** Scrollable receipt breakdown, order ID copy tool, and live timestamps.

### 👨‍🍳 3. Kitchen Display System (KDS) (`/kitchen`)
* **Live Order Queue Screen:** Displays active orders sorted by preparation urgency and time elapsed.
* **Recipe Viewer Modal:** Line chefs can view exact ingredient measurements and preparation recipes directly on screen.
* **One-Tap Status Action Toggles:** Chefs update dish status to *"Mulai Masak"* (Cooking) and *"Selesai Masak"* (Ready) with one click.

### 🤵 4. Waiter POS & Billing Portal (`/waiter/*`)
* **Visual Table Management Map:** Real-time visual overview of occupied, reserved, and available tables.
* **Food Delivery Dispatch:** Notifies waiters when dishes are ready, with a single-click *"Antar ke Meja"* (Serve to Table) action.
* **Thermal Receipt Printing:** Struk/invoice generation (`/print/invoice`) for cashier and waiter operations.

### 📦 5. Controlled Inventory & Recipe Management (`/admin/inventory`)
* **Recipe Costing & Ingredients Deduction:** Links every menu item to specific raw materials (e.g., 200g Beef, 15ml Sauce).
* **Automatic Stock Deduction:** Deducts ingredient inventories upon order placement and restores stock if an order is cancelled.
* **Purchase Orders & Audit Logs:** Complete tracking for supplier intake, stock adjustments, and inventory variance logs.

### 🔒 6. Multi-Role Authorization & Surface Protection (`/login`, `/login/staff`)
* **Role-Based Access Control (RBAC):** `ADMIN`, `CHEF`, `WAITER`, `CUSTOMER`.
* **Surface Isolation Guard:** Middleware rejects staff accounts attempting to log in on public customer portals and vice versa with friendly portal redirect guidance.
* **`httpOnly` JWT Cookie Security:** Prevents token exposure and client-side XSS vulnerabilities.

---

## 🛠️ Tech Stack & Architecture

### System Architecture
```
palatia/
├── frontend-web/          # Next.js 16 App Router & Turbopack Frontend
│   ├── src/app/           # App routes (Public, Auth, Admin, Kitchen, Waiter)
│   ├── src/components/    # Public UI, Menu, Cart Modals, Backoffice Components
│   ├── src/services/      # Client API Services (auth, me, orders, menu, public)
│   ├── src/store/         # Zustand Client State (Cart, Table Tokens)
│   └── src/lib/           # API Client, Formatters, Roles & Constants
└── server/                # Node.js Express REST API & WebSockets Engine
    ├── src/controllers/   # Express Controllers with Base Response pattern
    ├── src/services/      # Business logic & Prisma ORM Data Queries
    ├── src/middleware/    # Surface guards, Auth, Error handlers, Zod validation
    └── prisma/            # PostgreSQL Database Schema & Migrations
```

### Technology Breakdown

| Tier | Technology | Purpose & Value |
| :--- | :--- | :--- |
| **Frontend Framework** | **Next.js 16 (App Router & Turbopack)** | Server-Side Rendering (SSR) for fast initial rendering + React 19 Client Components for interactive UI. |
| **Language** | **TypeScript 5** | Strict type safety across client state, API contracts, and database models. |
| **Styling & UI** | **Tailwind CSS + Radix UI + Lucide Icons** | Utility-first responsive design, accessible dialog primitives, and consistent icon set. |
| **Real-Time Engine** | **Socket.io** | Bi-directional WebSocket communication for live kitchen status updates and waiter notifications. |
| **Backend API** | **Node.js + Express** | High-concurrency RESTful API service for order processing, authentication, and inventory. |
| **Database & ORM** | **PostgreSQL + Prisma ORM** | Relational database schema with strict ACID transactions, foreign keys, and migration history. |
| **State Management** | **Zustand** | Lightweight client state for cart management, table tokens, and real-time socket connections. |

---

## 💎 Design Patterns & Engineering Highlights

### 1. Standardized Base Response Pattern (`sendSuccess` / `sendError`)
All API responses follow a uniform JSON structure across all endpoints:

```json
// Success Response (sendSuccess)
{
  "success": true,
  "message": "Order created successfully",
  "data": { "id": 102, "code": "PAL-94300", "total": 119600 },
  "meta": { "page": 1, "total": 1 }
}

// Error Response (sendError)
{
  "success": false,
  "message": "Akun ADMIN (staff) terdeteksi. Silakan login melalui Portal Staff.",
  "errorCode": "FORBIDDEN",
  "data": null
}
```

### 2. Surface Guard Security Pattern
To prevent authorization ambiguity, the system enforces strict surface scoping:
* **Public Surface (`surface = "public"`)**: Accepts only `CUSTOMER` accounts.
* **Staff Surface (`surface = "staff"`)**: Accepts only `ADMIN`, `CHEF`, and `WAITER` accounts.

### 3. Positive & Negative UX Flow
* **Inline Field Validation:** Instant feedback on invalid inputs using `zodResolver`.
* **Global Error Boundary (`error.tsx`):** Unhandled runtime exceptions render a friendly retry interface instead of a white screen.
* **Custom 404 Page (`not-found.tsx`):** Styled 404 page encouraging user recovery to home or menu.
* **Dynamic Layout Math:** Responsive modals with dynamic height caps (`max-h-[350px] overflow-y-auto`) and pinned checkout buttons for single-hand mobile use.

---

## ⚡ Getting Started (Local Development)

### Prerequisites
* **Node.js**: `v20.x` or higher
* **npm**: `v10.x` or higher
* **PostgreSQL**: `v15.x` or higher (or Docker)

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/thefarhany/palatia.git
cd palatia

# Install Backend dependencies
cd server
npm install

# Install Frontend dependencies
cd ../frontend-web
npm install
```

### 2. Environment Configuration

Create a `.env` file in the `server` directory:
```env
PORT=4000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/palatia_db?schema=public"
JWT_SECRET="super-secret-jwt-key-palatia-2026"
CORS_ORIGIN="http://localhost:3000"
PUBLIC_URL="http://localhost:3000"
NODE_ENV="development"
```

Create a `.env.local` file in the `frontend-web` directory:
```env
NEXT_PUBLIC_API_URL="http://localhost:4000"
API_URL="http://localhost:4000"
```

### 3. Database Migration & Seed

```bash
cd server
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. Run Development Servers

Run the backend server:
```bash
cd server
npm run dev
# Express API running at http://localhost:4000
```

Run the frontend app in a separate terminal:
```bash
cd frontend-web
npm run dev
# Next.js running at http://localhost:3000
```

---

## 🐳 Docker Deployment

Run the entire stack using Docker Compose:

```bash
docker-compose up -d --build
```

Services started:
* `palatia-db`: PostgreSQL database on port `5432`
* `palatia-server`: Express API & Socket.io on port `4000`
* `palatia-frontend`: Next.js web application on port `3000`

---

## 👥 Default Demo Credentials

| Role | Portal URL | Email | Password |
| :--- | :--- | :--- | :--- |
| **Admin** | `/login/staff` | `admin@palatia.id` | `password123` |
| **Chef (Kitchen)** | `/login/staff` | `chef@palatia.id` | `password123` |
| **Waiter** | `/login/staff` | `waiter@palatia.id` | `password123` |
| **Customer** | `/login` | `customer@gmail.com` | `password123` |

---

## 📄 Documentation & Showcases

* **Full Project Showcase & Pitch Deck Guide:** [PALATIA_PROJECT_SHOWCASE.md](./PALATIA_PROJECT_SHOWCASE.md)

---

## 📜 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

<p center>
  Made with ❤️ by <strong>Farhan</strong> (<code>thefarhany</code>)
</p>
