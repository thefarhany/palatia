# Palatia — Tech Stack & Architecture Rationale

## 🏗️ Architecture Overview

Palatia is engineered as a **unified multi-surface platform** driven by a single RESTful API and WebSocket real-time engine. 

```
                                 ┌──────────────────────── Belalang Server / Cloudflare ────────────────────────┐
                                 │                                                                               │
┌──────────────────────────────┐ │  ┌────────────┐             ┌────────────┐  Prisma   ┌───────────────┐         │
│ Web Backoffice               │◄┼──            │  REST + WS  │            │──────────▶│   MySQL 8     │         │
│ (ADMIN / CHEF / WAITER)      │◄┼─ Cloudflare ─┼────────────▶│ server/    │           │ (unpublished  │         │
├──────────────────────────────┤ │  Tunnel      │  REST       │ Express+TS │           │  container)   │         │
│ Web Public & PWA Surface     │◄┼─ routes      │────────────▶│ Socket.IO  │           └───────────────┘         │
│ (Landing / QR / Guest Track) │◄┼─ dashboard   │             │ Zod + JWT  │                                     │
└──────────────────────────────┘ │              │             └────────────┘                                     │
                                 │              │  api-palatia.thefarhany.xyz                                   │
                                 │              │  ▲ Socket.IO rooms: role:*, user:*, order:{id}                │
                                 └──────────────┴────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack Breakdown

| Layer | Technology Choice | Rationale & Justification |
|---|---|---|
| **API Server** | Node.js + Express.js + TypeScript | High throughput I/O, rapid iteration across front-end and back-end in a unified type system. |
| **Database & ORM** | MySQL 8 + Prisma ORM | Relational integrity, native `DECIMAL` support for financial precision, type-safe queries, migration management (`prisma migrate`), and raw transaction control. |
| **Real-time Sync** | Socket.IO (Web) + Room Channels | Low-latency bi-directional WebSocket events for Kitchen Display Systems, Waiter floor updates, and customer status feeds. |
| **Authentication** | JWT (JSON Web Tokens) + Bcrypt | Stateless authentication, multi-surface token passing, role-based middleware guards (`ADMIN`, `CHEF`, `WAITER`, `CUSTOMER`). |
| **Data Validation** | Zod Schema Validation | Strict validation at all boundary endpoints (requests, params, body schemas) preventing injection and payload corruption. |
| **Web Front-End & PWA** | Next.js 15 (App Router) + Tailwind CSS + Native Manifest (`manifest.ts`) + Service Worker (`sw.js`) | Staff dashboards + public menu (QR target) + installable PWA. Dark mode via CSS tokens. Staff read-only mode with topbar warning banner. Single deployable unit, fast SSR/SSG rendering. |
| **Styling & UI** | Tailwind CSS + Lucide Icons + Shadcn UI | Utility-first CSS, responsive dark/light mode tokenizing, custom accessible modal dialogs & cards. |
| **Media Handling** | Multer + Disk Storage Engine | Slugified upload filenames (`ayam-geprek.jpg`), **automatic disk file cleanup** (`deleteUploadFile`) on dish replacement/deletion, SVG proxy fallback handling. |
| **Automated Testing** | Vitest (Backend) + Playwright (E2E) | 121 backend integration tests (100% pass) + 23 Playwright E2E web suite tests (100% pass). |
| **Deployment** | Docker Compose + Cloudflare Tunnel | Isolated container deployment on self-hosted Linux server behind encrypted Cloudflare Tunnels. |

---

## 📁 Repository & Directory Architecture

```
palatia/
├── docs/                      # Technical specification, PRD, ERD, API contract & user flows
├── server/                    # Node.js + Express + Prisma + MySQL API Server
│   ├── src/
│   │   ├── controllers/      # Request handlers (auth, menu, order, inventory, upload)
│   │   ├── middleware/       # Auth JWT, Zod validation, role gates (requireRole, requireCustomer)
│   │   ├── routes/           # Public (/api/public), Auth (/api/auth), Customer (/api/me), BO (/api/bo)
│   │   ├── services/         # Business logic (order state machine, inventory auto-deduction, audit)
│   │   ├── lib/              # Prisma client instance, pricing math, upload & slugify helpers
│   │   └── validators/       # Zod validation schemas
│   ├── prisma/               # Database schema definitions & migrations
│   └── tests/                # Vitest integration test suite (121 tests)
│
└── frontend-web/              # Next.js App Router Codebase (Single Deployable Unit)
    ├── src/
    │   ├── app/
    │   │   ├── (backoffice)/ # Staff Surfaces: /admin, /kitchen, /kitchen/recipe, /waiter
    │   │   ├── (public)/     # Customer Surfaces & PWA: /, /menu, /reservasi, /track/[token], manifest.ts
    │   │   └── print/        # Print-ready Invoice & Table QR Sheet routes
    │   ├── components/       # UI components (ChefHeader, RecipeModal, CartModal, Sidebar, PWARegister)
    │   ├── services/         # API client bindings (menu-service, inventory-service, orders-service)
    │   ├── store/            # Client state stores (orders-store, cart-store, menu-store)
    │   └── lib/              # Type definitions, formatting utilities, role helpers
    └── public/
        └── sw.js             # Service Worker for PWA asset caching & offline support
```

---

## 💡 Key Design & Engineering Patterns

### 1. Progressive Web App (PWA) & Multi-Surface Architecture
`frontend-web` leverages Next.js Route Groups `(backoffice)` and `(public)` with PWA capabilities:
- Native Web App Manifest (`manifest.ts`) enables one-tap installation on Android, iOS, and Desktop.
- Service Worker (`sw.js`) provides stale-while-revalidate caching and offline HTML fallback.

### 2. PREPAID Model & Kitchen Gate
To prevent unpaid food preparation waste:
- Orders enter `PENDING (UNPAID)` status upon placement.
- Socket.IO emits `order:created` and admits orders into the **Chef KDS Queue ONLY after `paymentStatus: PAID`**.
- Order lifecycle follows: `PENDING (PAID) → PREPARING → READY → SERVED → COMPLETED`.

### 3. Database-Enforced Double-Booking Prevention
Rather than relying on fragile application-level check-then-insert logic, Palatia enforces table reservation uniqueness directly in MySQL:
```sql
UNIQUE INDEX `reservations_table_id_date_time_slot_key` (`table_id`, `date`, `time_slot`);
```
Any concurrent attempt to reserve the same table for the same date and time slot fails instantly with an atomic DB constraint error (`409 Conflict`).

### 4. Chef Recipe Unit Formatting Engine
Inventory stock is tracked in bulk storage units (`kg`, `L`), which are awkward for kitchen prep. Palatia includes an automatic culinary unit conversion helper:
```ts
function formatCookingQty(rawQty: number | string, unit: string): string {
  const qty = Number(rawQty);
  if (isNaN(qty)) return `${rawQty} ${unit}`;
  const u = unit.toLowerCase().trim();

  if ((u === "kg" || u === "kilogram") && qty < 1) {
    return `${Math.round(qty * 1000)} gram`;
  }
  if ((u === "l" || u === "liter") && qty < 1) {
    return `${Math.round(qty * 1000)} ml`;
  }
  return `${qty} ${unit}`;
}
```

### 5. Media Management & Auto-Cleanup Engine
- **Slugified Filenames**: Uploaded menu images are saved as `<slug>.<ext>` (e.g., `ayam-geprek.jpg`).
- **Disk Cleanup**: When a menu image is updated or deleted, `deleteUploadFile(oldUrl)` asynchronously unlinks the previous file from `/uploads/menu/`, keeping server storage lean.
- **Proxy Fallback**: Next.js proxy route handles missing disk files gracefully by returning an inline SVG Palatia placeholder with HTTP `200 OK`, avoiding Next.js `400 Bad Request` optimizer crashes.

---

## 🔒 Security & RBAC Enforcements

1. **Role-Based Access Control (RBAC)**: Route middleware validates JWT payloads against strict role gates (`requireRole("ADMIN", "CHEF", "WAITER")`).
2. **Customer Guard (`requireCustomer`)**: Staff JWT tokens are prohibited from executing customer transactions (e.g., placing guest orders or personal reservations) via `requireCustomer` middleware.
3. **Staff Public Browsing Mode**: Staff accounts browsing public landing or menu pages are served in Read-Only Mode with a sticky `StaffTopBanner` alerting them of staff status.