# Palatia — User Flows

## 1. Customer — Dine-in / Takeaway Order (PREPAID: pay first, then the kitchen cooks)

```
Register/Login (or scan table QR)
     │
     ▼
Browse menu (search, filter by category, install PWA)  [public, read-only for staff]
     │
     ▼
Add to cart (qty, notes per item)
     │
     ▼
Place order ──► PENDING (UNPAID)                  [kitchen gate: CHEF sees PAID orders only]
     │
     ▼
Pay upfront (in-app "Pay Now" or Cashier/Waiter records payment in Billing)
     │                │
     │                └──► Socket.IO: order:paid ──► Kitchen dashboard (web)
     ▼
Track status (Web & PWA: live via Socket.IO / token polling)

Kitchen: PREPARING → READY  (only paid orders enter the queue)
     │
     ▼
Waiter: READY ──► SERVED (Antar ke Meja) ──► COMPLETED
     │
     ▼
COMPLETED ──► inventory auto-deducted ──► low-stock alert if under reorder level
```

Order types: **DINE_IN** (table-bound, from QR or table picker) · **PICKUP** (counter pickup) · **TAKEAWAY** (leave the premises).

## 1b. Customer — Order From Table via QR (login optional on web)

```
Admin prints QR per table (GET /api/tables/:id/qr.png) → sticks it on the table
     │
     ▼
Customer scans QR with phone camera
     │
     ▼
Public menu opens: <web>/menu?t=<token>  (no login yet — menu browsable anonymously)
     │
     ▼
App resolves token (GET /api/public/table/:token) → "Ordering from Table 7"
     │
     ├── PATH A — logged in (or registers at checkout):
     │      order (DINE_IN, tableId) → owned by account → live notifications in-app
     │
     └── PATH B — anonymous (guest):
            order without login (must be DINE_IN from the table QR)
            → server returns an unguessable trackingToken (never the ORD-xxxxx code — sequential = guessable)
            → tracking page <web>/track/<token> (polls GET /api/public/orders/:token)
            → Pay Now → POST /api/public/orders/:token/pay
            → the tracking page IS the guest's notification screen
     │
     ▼
Kitchen sees the order live upon payment (order:paid / order:created)
```

**QR security:** the QR embeds a random token (not the table id) — guessing is infeasible.
Rotating the token (`POST /api/tables/:id/qr`) instantly kills every printed QR for that table.

## 2. Customer — Table Reservation

```
Pick date → pick time slot → party size
     │
     ▼
System shows available tables (real-time)
     │
     ▼
Reserve ──► transaction: INSERT with unique index (table_id, date, time_slot)
     │            ├─ success → status CONFIRMED → notification
     │            └─ conflict → 409 "slot taken" → pick another table
     ▼
Arrive → Waiter marks SEATED → after visit: COMPLETED
```

**Double-booking prevention:** the unique DB index is the source of truth. Application code never does check-then-insert.

## 3. Chef — Kitchen Queue & Recipe Catalog

```
Login (CHEF role)
     │
     ├── PATH A — Kitchen Display (/kitchen):
     │      Live queue of PAID PENDING/PREPARING orders (Socket.IO room: role:kitchen)
     │      Tap order → PREPARING ──► READY (only paid orders appear)
     │      order:status event → customer's screen + waiter view
     │
     └── PATH B — Recipe Catalog (/kitchen/recipe):
            Header Nav: Switch between Kitchen Display & Recipe
            Browse 6-card per row grid of dish recipes (search & category filter)
            Click card → Recipe Modal popup (ingredients, cooking unit conversions `gram`/`ml`, numbered list 1..N)
```

## 4. Waiter — Service Flow

```
Login (WAITER role)
     │
     ▼
Waiter Dashboard: Orders (/waiter/orders), Reservations (/waiter/reservations), Billing (/waiter/billing)
     │
     ├── Orders: View active orders → READY orders ──► "Antar ke Meja" (SERVED) ──► "Selesaikan" (COMPLETED)
     ├── Reservations: View daily reservations → CONFIRMED ──► SEATED ──► COMPLETED
     └── Billing: Search/filter transactions → Click order ──► Popup Invoice Modal ──► Record Payment (Cash/Card) / Apply Discount ──► "Cetak Struk" (/print/invoice?order=id)
```

## 5. Admin — Operations

```
Login (ADMIN role)
     │
     ├── Menu management (CRUD, toggle availability, Best Seller badge)
     ├── Staff management (create account, assign role, deactivate)
     ├── Table management (create table, capacity, QR print PNG, rotate token)
     ├── Inventory (ingredients, reorder levels, purchase orders)
     │        └── low-stock notification ──► create purchase order ──► receive → stock up
     ├── Reports (daily sales, popular dishes)
     └── Audit log
```

## 6. Auth & Role Routing & Staff Public Browsing

```
Login
  │
  ├─ CUSTOMER → (Public Web & PWA) home: menu / orders / reservation
  ├─ CHEF     → (Web) kitchen dashboard (/kitchen)
  ├─ WAITER   → (Web) waiter orders (/waiter/orders)
  └─ ADMIN    → (Web) admin dashboard (/admin)

Staff Browsing Public Surface:
  Staff accounts (ADMIN, CHEF, WAITER) can browse public pages (/, /menu, /about, /kontak) in Read-Only Mode.
  - A sticky topbar banner (StaffTopBanner) notifies staff of Read-Only status with a "Kembali ke Dashboard Staff" button.
  - Public navbar displays the "Masuk" button for customer auth.
  - Backend strictly rejects customer orders/reservations from staff tokens via requireCustomer middleware (403 Forbidden).
```

## 7. Role × Feature Matrix (UI/UX reference)

Accounts: ADMIN/CHEF/WAITER are created by ADMIN (`POST /api/auth/staff`). Registration always creates CUSTOMER.
Test accounts: `admin@ / chef@ / waiter@ / customer@palatia.id` — password `password123`.

| # | Feature | ADMIN | CHEF | WAITER | CUSTOMER | Surface |
|---|---|:--:|:--:|:--:|:--:|---|
| 1 | Register / login | ✅ | ✅ | ✅ | ✅ | Public Web & PWA |
| 2 | Browse menu (search, filter category) | ✅ (read) | ✅ (read) | ✅ (read) | ✅ | Public Web & PWA |
| 3 | Menu CRUD + image upload | ✅ | — | — | — | Web admin |
| 4 | Manage staff (create accounts, assign role) | ✅ | — | — | — | Web admin |
| 5 | Manage tables (create, capacity, status) | ✅ | — | — | — | Web admin |
| 5b | Table QR: print PNG, rotate (revoke) | ✅ | — | — | — | Web admin |
| 5c | Resolve scanned QR → table (public, no auth) | — | — | — | ✅ | Public Web & PWA |
| 6 | Availability per date + slot | ✅ | ✅ | ✅ | ✅ | Public Web & PWA |
| 7 | Create reservation | ✅ | — | — | ✅ | Public Web & PWA |
| 8 | Manage reservation status (confirm/seat/complete/cancel) | ✅ | — | ✅ | cancel own only | Web waiter |
| 9 | Create order | ✅ | — | ✅ | ✅ own (web QR: guest allowed, DINE_IN only) | Public Web & PWA + Web waiter |
| 9b | Guest order tracking + Pay Now by token (public, no login) | — | — | — | ✅ | Public Web & PWA |
| 10 | Drive status: PENDING → PREPARING → READY (PAID orders only) | ✅ | ✅ | — | — | Web kitchen |
| 10b | Chef Recipe Catalog & Recipe Modal popup (`/kitchen/recipe`) | ✅ | ✅ | — | — | Web kitchen |
| 11 | Drive status: READY → SERVED → COMPLETED (serve/hand over) | ✅ | — | ✅ | — | Web waiter |
| 12 | Cancel order (before PREPARING) | ✅ | — | ✅ | ✅ own | Public Web & PWA |
| 13 | Pay (CASH / CARD_AT_COUNTER) | ✅ | — | ✅ | ✅ own | Public Web "Pay Now" + Web Billing |
| 14 | Apply invoice discount | ✅ | — | ✅ | — | Web waiter Billing |
| 15 | View invoice & Print Struk | ✅ | — | ✅ | ✅ own | Web Billing + `/print/invoice` |
| 16 | Inventory: ingredients, recipes, purchase orders | ✅ | — | — | — | Web admin |
| 17 | Reports (daily sales, popular dishes) | ✅ | — | — | — | Web admin |
| 18 | Audit log | ✅ | — | — | — | Web admin |
| 19 | Notifications | low stock, new order, new reservation | new paid order | new reservation | order status, reservation confirmed | Web (live) |
| 20 | Custom 404 Not Found Page | ✅ | ✅ | ✅ | ✅ | Public Web & PWA |
| 21 | Install Progressive Web App (PWA) | ✅ | ✅ | ✅ | ✅ | Mobile & Desktop Browser |

Notes for design:
- **Ownership rules**: CUSTOMER actions on orders/reservations are restricted to their own data (stranger's = 404, not 403 — existence is not leaked).
- **Status flows the UI expresses**: Order `PENDING (UNPAID→PAID) → PREPARING → READY → SERVED → COMPLETED` (+CANCELLED while PENDING; PREPARING requires PAID); Reservation `PENDING → CONFIRMED → SEATED → COMPLETED` (+CANCELLED).