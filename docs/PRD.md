# Palatia — Product Requirements Document (PRD)

## Product Vision

Palatia is an enterprise-grade Restaurant Management System that connects the dining room, the kitchen, and the back office in one platform. Customers order, reserve, and track orders from the responsive web or installable Progressive Web App (PWA); staff manage operations from real-time web dashboards.

**Portfolio positioning:** demonstrates full-stack development (TypeScript server + two Next.js web surfaces), real-time communication (Socket.IO), Progressive Web App installability & offline caching (`manifest.ts` + `sw.js`), role-based access control, inventory management, and automated media lifecycle management — all backed by a single REST API.

**Product shape — 2 web surfaces (1 Next.js codebase) + 1 Node.js REST/WebSocket backend:**

| # | Surface | Pengguna | Kondisi |
|---|---|---|---|
| 1 | **Website backoffice** — staff dashboards (ADMIN/CHEF/WAITER) | `frontend-web` route group `(backoffice)` | ✅ dibangun |
| 2 | **Website landing, client pesan menu & PWA** — landing page, menu publik, QR order, guest tracking, installable PWA (`sw.js` + `manifest.ts`) | `frontend-web` route group `(public)` | ✅ dibangun |

Web backoffice & web publik berbagi satu codebase Next.js lewat route groups `(backoffice)` / `(public)` — URL dan layout-nya terpisah, deploy satu aplikasi.

## Problem Statement

Small-to-medium restaurants juggle disconnected tools: paper reservations, WhatsApp orders, spreadsheets for stock. Palatia unifies these into one system with real-time sync between customer actions and kitchen/staff operations.

## Actors & Roles

| Role | Access | Primary surface |
|---|---|---|
| ADMIN | Everything: menu, staff, inventory, reports, audit logs, table management | Web backoffice (`/admin`) |
| CHEF | Kitchen queue: view incoming paid orders, update status; Chef recipe & composition catalog | Web backoffice (`/kitchen`, `/kitchen/recipe`) |
| WAITER | Order management, serving to table, payment recording, billing & invoice printing, reservations | Web backoffice (`/waiter/orders`, `/waiter/billing`) |
| CUSTOMER | Browse menu, cart, order, table reservation, track order | Installable PWA & public web (`(public)`) (landing, menu, QR order, guest tracking) |

*Note on Staff Public Access:* Staff members (`ADMIN`, `CHEF`, `WAITER`) can browse all public customer pages in **Read-Only Mode** with a topbar notification banner alerting them of staff status. Customer order placement and reservations are strictly guarded to customer accounts.

## Scope

### In scope (full spec)

- **Authentication & RBAC** — register/login (JWT), 4 roles enforced by server middleware; strict customer-only order creation guard (`requireCustomer`).
- **Progressive Web App (PWA)** — Web App Manifest (`manifest.ts`), Service Worker (`sw.js`) for offline asset caching, and standalone home-screen installability.
- **Menu & Image Management** — CRUD with category, description, price, availability, image; public search & filtering; **slugified filenames** (`ayam-geprek.jpg`) and **automatic disk cleanup** of obsolete upload files on update/delete; SVG fallback proxy handling.
- **Table reservation** — date, time slot, party size; real-time availability; **no double-booking** (DB unique index + transaction, not app-level checks).
- **Food ordering & Cart** — cart with max 150-char kitchen notes limit & live character counter; dine-in & takeaway; order status lifecycle.
- **Kitchen Dashboard & Chef Recipes** — real-time incoming orders (`paymentStatus: PAID` only), status updates: PREPARING → READY (Socket.IO); **Chef Recipe View** (`/kitchen/recipe`) with 6-card per row grid, search/category filter, pop-up recipe modal, automatic **cooking unit formatting** (`gram`, `ml`), and numbered list styling (`1, 2, 3`).
- **Billing** — interactive billing table & receipt modal with subtotal, tax (GST 10%), service charge (5%), discounts, grand total. Payment recorded by staff as CASH or CARD_AT_COUNTER. Printable standalone invoice (`/print/invoice?order=id`).
- **Inventory management** — ingredients, stock levels, suppliers, purchase orders; automatic stock deduction when orders complete; low-stock alerts.
- **Admin dashboard & reports** — daily sales, popular dishes, inventory monitoring, staff management, table QR code PNG print & rotation.
- **Notifications** — reservation confirmed, order status change, payment recorded, low stock, new kitchen orders.
- **Custom 404 & UI/UX** — responsive dark/light mode support, customer-themed 404 Not Found page, real-time Socket.IO sync.

### Out of scope (documented as future work)

- Online payment gateway integration (Stripe/Midtrans) — invoice + counter payment only for v1.
- AI recommendations, voice ordering, loyalty program, delivery module, multi-branch support.

## Success Criteria

1. Complete order flow works end-to-end: reserve → order → kitchen updates (paid orders only) → waiter serves → invoice → paid → completed.
2. Two customers booking the same table/slot cannot both succeed (DB-enforced).
3. Kitchen sees a new order within 1s of payment placement (no page refresh).
4. Completing an order deducts ingredient stock automatically; admin sees low-stock alerts.
5. PWA installs seamlessly on mobile & desktop with offline asset caching.
6. Deployed and accessible online (homeserver + Cloudflare Tunnel).

## User Stories (high level)

- As a **customer**, I can browse the menu, add items to a cart with notes, place an order, install the PWA, and watch its status update live.
- As a **customer**, I can reserve a table for a date/time slot and see only available slots.
- As a **chef**, I see incoming paid orders appear instantly, can move them through PREPARING → READY, and view dish recipes.
- As a **waiter**, I can view ready orders, deliver them to tables (READY → SERVED → COMPLETED), record payments (cash/card), and view/print receipt invoices.
- As an **admin**, I manage menu/staff/inventory/tables and read daily sales and popular-dish reports.