# Palatia — Architecture

## System Overview

**1 Node.js REST/WebSocket backend + 2 Web Surfaces (1 Next.js codebase with PWA)**: web backoffice & web landing+menu ordering + PWA.

| Client | Codebase | API yang dipakai | Realtime / Offline |
|---|---|---|---|
| Web backoffice `(backoffice)` | `frontend-web` | `/api/bo` (+ `/api/me` notif pribadi) | Socket.IO |
| Web landing + menu + PWA `(public)` | `frontend-web` | `/api/public` & `/api/me` (kalau login) | Socket.IO room order / PWA `sw.js` offline cache |

```
                 ┌──────────────────────── belalang homeserver (Docker) ────────────────────────┐
                 │                                                                               │
┌──────────────┐ │  ┌────────────┐             ┌────────────┐  Prisma   ┌───────────────┐         │
│ Web (bo)     │◄┼──            │  REST+WS    │            │──────────▶│   MySQL 8     │         │
│ backoffice   │◄┼─ Cloudflare ─┼────────────▶│ server/    │           │ (unpublished  │         │
├──────────────┤ │  Tunnel      │  REST       │ Express+TS │           │  container)   │         │
│ Web (public) │◄┼─ routes in ──┼────────────▶│ Socket.IO  │           └───────────────┘         │
│ PWA App      │◄┼─ dashboard   │             │ Zod + JWT  │                                     │
└──────────────┘ │              │             └────────────┘                                     │
                 │              │  api-palatia.thefarhany.xyz                                   │
                 │              │  ▲ Socket.IO rooms: role:*, user:*, order:{id}                │
                 └──────────────┴────────────────────────────────────────────────────────────────┘
```

- **frontend-web** = ONE Next.js codebase hosting TWO web surfaces via route groups `(backoffice)` / `(public)`, installable Progressive Web App (`manifest.ts` + `sw.js`), plus standalone print routes (`/print/invoice`, `/print/qr-sheet`).

## Data Model (Prisma / MySQL 8, utf8mb4)

```
users            id, name, email (uniq), password_hash, role ENUM(ADMIN,CHEF,WAITER,CUSTOMER), is_active, timestamps

menu_items       id, name (uniq), category, description, price (DECIMAL), available BOOL, is_featured BOOL,
                 image_url, timestamps
recipe_items     id, menu_item_id →menu_items, ingredient_id →ingredients, qty DECIMAL

tables           id, number (uniq), capacity, status ENUM(FREE,OCCUPIED,RESERVED,OUT_OF_SERVICE),
                 qr_token (uniq, nullable) — token in printed table QR; rotation revokes prints
reservations     id, user_id →users (nullable — guests carry name+phone inline), name?, phone?,
                 table_id →tables, date DATE, time_slot ("11:00"…"21:00", validated by Zod), guests INT,
                 status ENUM(PENDING,CONFIRMED,SEATED,COMPLETED,CANCELLED), timestamps
                 ★ UNIQUE (table_id, date, time_slot)  ← double-booking guard (guest & member alike)

orders           id, order_code, tracking_token (uniq, nullable — guest handle; ORD-code is guessable),
                 customer_id →users (nullable for guest/walk-in), table_id →tables (nullable),
                 type ENUM(DINE_IN,PICKUP,TAKEAWAY), status ENUM(PENDING,PREPARING,READY,SERVED,COMPLETED,CANCELLED),
                 payment_status ENUM(UNPAID,PAID), payment_method ENUM(CASH,CARD_AT_COUNTER,nullable),
                 subtotal, tax, service_charge, discount, total (all DECIMAL), timestamps
order_items      id, order_id →orders, menu_item_id →menu_items, qty INT, unit_price DECIMAL, notes

ingredients      id, name, unit, stock DECIMAL, reorder_level DECIMAL, supplier_name, supplier_phone, timestamps
purchase_orders  id, code, status ENUM(ORDERED,RECEIVED,CANCELLED), supplier_name, timestamps
purchase_items   id, purchase_order_id, ingredient_id, qty, unit_cost

notifications    id, user_id →users, type, payload JSON, read BOOL, created_at
audit_logs       id, actor_id →users, action, entity, entity_id, meta JSON, created_at
```

Notes:
- Money in `DECIMAL`, never float.
- Invoice amounts (tax 10%, service 5%) are config constants in `lib/pricing.ts`, applied at invoice generation.

## API Surface (REST — grouped by audience, prefix `/api`)

Three groups, each mounted with its own auth gate (`src/routes/public.ts` / `me.ts` / `bo.ts`):

| Group | Gate | Endpoints |
|---|---|---|
| **`/api/public`** | none | `GET /menu` (+ `/categories`, includes `isFeatured` badge) · `POST /orders` (optional auth: guest = DINE_IN from QR, JWT = member) · `GET /table/:token` (QR resolve) · `GET /orders/:trackingToken` (guest tracking) · `POST /orders/:trackingToken/pay` (guest Pay Now) · **reservations: `GET /reservations/availability?date&slot`, `POST /reservations` (guest — name+phone inline, no login)** |
| **`/api/auth`** | public | `POST /register`, `POST /login` |
| **`/api/me`** | JWT (CUSTOMER only for orders/reservations via `requireCustomer`) | `GET /profile` · orders: `POST /orders`, `GET /orders`, `GET /orders/:id`, `POST /:id/pay`, `PATCH /:id/cancel`, `GET /:id/invoice` · reservations: `GET /availability?date&slot`, `POST /`, `GET /`, `PATCH /:id/status` · notifications: `GET /`, `PATCH /read-all`, `PATCH /:id/read` · `POST /uploads/avatar` |
| **`/api/bo`** | JWT + staff (ADMIN/CHEF/WAITER) | orders: `POST /orders`, `GET /orders` (CHEF role receives PAID orders only), `GET /:id`, `PATCH /:id/status`, `PATCH /:id/cancel`, `POST /:id/pay`, `PATCH /:id/discount` · reservations: `GET /`, `PATCH /:id/status` · menu (ADMIN, CHEF read): `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id` · staff (ADMIN): `GET /staff`, `POST /staff`, `PATCH /staff/:id` · tables (ADMIN): `GET /`, `POST /`, `PATCH /:id`, `GET /:id/qr.png`, `POST /:id/qr` (rotate = revoke) · inventory (ADMIN, CHEF read recipe): `GET/POST/PATCH /ingredients`, `GET/PUT /recipes/:menuItemId` (CHEF read-only via `GET /recipes/:menuItemId`), `GET/POST /purchase-orders`, `PATCH /purchase-orders/:id/receive|cancel` · `POST /uploads/menu` (ADMIN: slugified filename `<slug>.<ext>`, auto-cleanup of obsolete disk image files) · reports (ADMIN): `GET /sales/daily`, `GET /sales/popular` · `GET /audit` (ADMIN) |

Client → group mapping: **PWA & Web Customer** = `/api/me` + `/api/public` · **Web backoffice** = `/api/bo` (+ `/api/me` for personal notifications) · **Public web menu** = `/api/public` only.

Rules: Zod validation middleware on every write; RBAC middleware per route; `requireCustomer` on customer order/reservation endpoints; JWT required except auth + public menu.

## Socket.IO Events (server → client)

| Event | Payload | Room / audience |
|---|---|---|
| `order:created` | order + items | `role:kitchen` (emitted on payment), `role:admin` |
| `order:status` | { orderId, status } | `order:{id}`, `role:waiter`, `role:admin` |
| `order:paid` | { orderId } | `order:{id}`, staff roles |
| `table:status` | { tableId, status } | `role:waiter`, `role:admin` |
| `reservation:created` / `reservation:status` | reservation | `role:waiter`, `role:admin` |
| `inventory:low` | { ingredientId, stock } | `role:admin` |
| `notification` | notification | `user:{id}` |

## Order Lifecycle State Machine (PREPAID model)

Both ordering modes pay upfront — the kitchen only cooks paid orders.

```
PENDING (UNPAID) ──pay──► PENDING (PAID) ──► PREPARING ──► READY ──► SERVED ──► COMPLETED
   │                                                                               ▲
   └──► CANCELLED (only while PENDING)                                             │
                                     handed/served to customer (waiter) ───────────┘
```

- **Gate**: `PENDING → PREPARING` requires `paymentStatus = PAID` (409 otherwise). Chef queue receives PAID orders only.
- **Waiter Flow**: `READY` order $\rightarrow$ Waiter delivers to table ("Antar ke Meja") $\rightarrow$ `SERVED` $\rightarrow$ Waiter completes ("Selesaikan") $\rightarrow$ `COMPLETED`.
- `pay` never changes status — it only records payment (+ emits `order:paid`).
- COMPLETED triggers: inventory deduction (recipe_items) → low-stock check → notification.

## Deployment (belalang, Docker)

- `server/docker-compose.prod.yml`: server container + MySQL (not published externally).
- `web/`: Next.js container (standalone output).
- Cloudflare Tunnel routes: `palatia.thefarhany.xyz` → web, `api-palatia.thefarhany.xyz` → server.
- `.env` production files live only on the server, never committed.
- Redeploy: `git pull` + `docker compose -f docker-compose.prod.yml up -d --build`.