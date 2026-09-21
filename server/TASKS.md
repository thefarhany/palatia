# Palatia — Backend Task Tracker

Progress backend `server/`. Rencana besar + web/android ada di `../docs/PRD.md` (urutan bangun) dan `../docs/architecture.md` (endpoint).

## Testing (Vitest + supertest + socket.io-client)

```bash
npm test     # semua test → DB test terpisah (palatia_test), data dev aman
```

- [x] Setup Vitest (`vitest.config.ts`, `tests/globalSetup.ts` — auto CREATE DATABASE palatia_test + migrate deploy)
- [x] `tests/auth.test.ts` — register/login/RBAC/deactivated user (8 tests)
- [x] `tests/menu.test.ts` — public browse + filter + CRUD admin (6 tests)
- [x] `tests/orders.test.ts` — totals server-side, state machine, cancel, pay placeholder, visibility (18 tests)
- [x] `tests/socket.test.ts` — auth handshake, `order:created` live ke chef, subscribe order + stranger ditolak (5 tests)
- [x] `tests/uploads.test.ts` — upload menu/avatar, mime whitelist, static serve (4 tests)
- Rule: **setiap fase baru wajib bawa test file sebelum marked complete**

## Fase 3.5 — Image Upload ✅ SELESAI

- [x] `POST /api/uploads/menu` (admin) → simpan ke `uploads/menu/<uuid>.<ext>`, response `{url: "/uploads/menu/..."}`
- [x] `POST /api/uploads/avatar` (semua role, avatar sendiri) → `uploads/profile/`, disimpan ke `users.avatar`
- [x] Multer: whitelist jpeg/png/webp, max 5MB, filename UUID (nama file client tidak dipakai)
- [x] Static serve `/uploads` + folder `uploads/` gitignored
- [x] Kolom `users.avatar` (migration `user_avatar`)
- [ ] Future: volume mount `uploads/` di compose.prod (deploy fase)

## Fase 1 — Infra + Auth + RBAC ✅ SELESAI

- [x] Express + TS skeleton, error handler, Zod middleware, helmet/cors
- [x] Docker Compose dev (`docker-compose.dev.yml`, MySQL 8 utf8mb4)
- [x] Prisma schema semua tabel + migration + seed (4 role, 6 menu, 10 meja, ingredients)
- [x] Auth: register (customer), login, `/me`, staff management (admin)
- [x] RBAC middleware `requireRole`, JWT (7d), bcryptjs
- [x] Socket.IO handshake JWT + rooms `role:*` / `user:*` / `order:*`

## Fase 2 — Menu ✅ SELESAI

- [x] Public browse: search (q), category filter, availability filter
- [x] `/api/menu/categories`
- [x] Admin CRUD (`POST`, `PATCH /:id`, `DELETE /:id`)

## Fase 3 — Orders + Socket.IO ✅ SELESAI

- [x] `POST /api/orders` — harga dari DB (client tidak dipercaya), total dihitung server (tax 10% + service 5% dari env), kode `ORD-xxxxx`
- [x] `GET /api/orders` (customer = milik sendiri, staff = semua) + `GET /api/orders/:id`
- [x] `PATCH /api/orders/:id/status` — state machine: PENDING→PREPARING→READY (chef), READY→SERVED→COMPLETED (waiter); jalur lain ditolak
- [x] `PATCH /api/orders/:id/cancel` — hanya sebelum PREPARING
- [x] `POST /api/orders/:id/pay` — **payment placeholder**: record method (CASH/CARD_AT_COUNTER), set PAID + COMPLETED, response seperti gateway callback
- [x] Events: `order:created` (→ CHEF/ADMIN), `order:status` (→ order:{id} + waiter/admin/chef)
- [x] Hook `onOrderCompleted()` nyempel di kedua jalur COMPLETED — tanda tangan buat fase 6

## Fase 4 — Reservations ✅ SELESAI

- [x] `GET /api/reservations/availability?date&slot` — tabel + flag reserved, meja OUT_OF_SERVICE disembunyikan
- [x] `POST /api/reservations` — guard double-booking murni dari unique index (P2002 → 409); validasi tanggal tidak lampau, kapasitas meja
- [x] `PATCH /api/reservations/:id/status` — waiter: PENDING→CONFIRMED→SEATED→COMPLETED (+CANCELLED); customer cuma boleh cancel miliknya sendiri sebelum SEATED
- [x] `GET /api/reservations` — customer = milik sendiri, staff = semua (filter date)
- [x] Tables: `GET /api/tables` (staff), `POST/PATCH` (admin)
- [x] Events: `reservation:created` / `reservation:status` → waiter/admin
- [x] Schema: kolom `slot` jadi String (Zod yang validasi) — migration `slot_varchar`
- [x] `tests/reservations.test.ts` (17 tests) — termasuk **2 booking paralel meja sama → tepat 1 sukses, 1 dapat 409** (bukti race-condition guard)

## Fase 5 — Billing ✅ SELESAI

- [x] `GET /api/billing/orders/:id/invoice` — payload invoice print-ready: restaurant meta, number, line items + amount, subtotal/discount/tax/service/total, paymentStatus/Method (customer = milik sendiri, staff semua)
- [x] `PATCH /api/billing/orders/:id/discount` (waiter/admin) — tax & service dihitung ulang dari (subtotal − discount); ditolak 409 kalau sudah PAID, 400 kalau melebihi subtotal
- [x] `RESTAURANT` meta di `lib/pricing.ts` (nama, alamat, telepon — isi asli sebelum deploy)
- [x] `tests/billing.test.ts` (9 tests) — rekomputasi totals, semua guard, akses invoice
- (Payment record: sudah jalan sejak fase 3 via `/api/orders/:id/pay` — placeholder)

## Fase 6 — Inventory ✅ SELESAI

- [x] `GET/POST/PATCH /api/inventory/ingredients` (admin) — stock, reorderLevel, supplier
- [x] `PUT /api/inventory/recipes/:menuItemId` (admin) — replace-all mapping menu → ingredient
- [x] **Auto-deduct**: `lib/inventory.ts` `onOrderCompleted()` — agregasi recipe qty × order qty per ingredient, decrement dalam 1 transaksi; ter-hook di 2 jalur COMPLETED (status SERVED→COMPLETED dan pay)
- [x] **Low-stock**: stok ≤ reorderLevel → notification `inventory:low` ke semua admin (DB row + socket `notification`)
- [x] Purchase orders: `POST` (code `PO-xxx`, validasi ingredient ada), `PATCH /:id/receive` (transaction: increment stock + status RECEIVED + notify), `PATCH /:id/cancel` (hanya saat ORDERED), `GET` list
- [x] `lib/notifications.ts` — `notifyUsers`/`notifyRole` (dipakai fase ini, fase 7 lanjut pakai)
- [x] `tests/inventory.test.ts` (10 tests) — deduct 2×0.3=0.6 dari 50→49.4, no-recipe = no-deduct, low-stock notif, PO receive/cycle guard
- ponytail: tanpa lock untuk 2 transisi COMPLETED bersamaan — state machine udah nutup jalur mayoritas; tambah conditional update kalau nanti kebuktiin perlu

## Fase 7 — Notifications + Reports + Audit ✅ SELESAI (in-app only; FCM push = future work)

- [x] **Trigger notifikasi ter-wire ke semua alur** (`notifyRole`/`notifyUser` di services):
  - `order:new` → CHEF (order masuk kitchen)
  - `order:status` → customer pemilik order (tiap transisi)
  - `payment:recorded` → customer (dengan total + metode)
  - `reservation:new` → WAITER; `reservation:status` → customer (confirmed/cancelled/seated/completed)
  - `inventory:low` / `inventory:received` → ADMIN (dari fase 6)
  - Setiap row juga di-push realtime via Socket.IO ke room `user:{id}` (web), Android polling (sesuai keputusan stack)
- [x] `GET /api/notifications` (milik sendiri, `?unread=true`), `PATCH /:id/read`, `PATCH /read-all`
- [x] `GET /api/reports/sales/daily` (admin) — orderCount, revenue, discounts, tax hari itu (order PAID+COMPLETED)
- [x] `GET /api/reports/sales/popular?days=N` (admin) — top dishes by qty, order COMPLETED
- [x] **Audit log**: `auditService.logAudit` — menu.created/updated/deleted, payment.recorded, billing.discount (awaited, durable). `GET /api/audit` (admin)
- [x] `tests/notifications.test.ts` (13 tests) — trigger per alur, isolation per user, unread filter, reports math, audit rows
- Future work: FCM push (butuh Firebase project + device token mgmt), email notif

## Fase 7.5 — QR Menu Meja ✅ SELESAI

- [x] Kolom `tables.qrToken` (unique, migration `table_qr`) — token random 16 hex; **nggak ada tabel QR terpisah** (token hidup di row meja)
- [x] Meja baru otomatis dapat token (di `reservationService.createTable`)
- [x] `GET /api/tables/:id/qr.png` (admin) — **QR langsung jadi PNG printable** (buka di browser → print → tempel ke meja), isi URL `${PUBLIC_URL}/menu?t=<token>`
- [x] `POST /api/tables/:id/qr` (admin) — **rotasi token** = satu-satunya "revoke/delete" (QR lama yang udah nempel meja langsung mati)
- [x] `GET /api/public/table/:token` (public, tanpa auth) — resolve scan → `{tableId, number, capacity, status}`; kontrak dengan web: halaman `/menu?t=<token>` resolve token ini
- [x] Dep baru: `qrcode` (server-side PNG generation)
- [x] `tests/qr.test.ts` (6 tests) — auto-token meja baru, resolve public, unknown 404, **rotate mematikan QR lama**, PNG magic bytes, RBAC
- CRUD-nya: Create (otomatis saat bikin meja) · Read (qr.png) · Update = rotate · Delete = rotate (token lama invalid)

## Fase 7.7 — Prepaid Order Model + PICKUP + Auto Table Status ✅ SELESAI

Keputusan hasil diskusi: **kedua mode ordering prepay** (bayar dulu, baru masak).

- [x] **OrderType: `DINE_IN | PICKUP | TAKEAWAY`** — DINE_IN wajib tableId (400 kalau nggak); PICKUP/TAKEAWAY tanpa meja. Mode 2A (kasir) = PICKUP
- [x] **Prepaid gate**: `PENDING→PREPARING` butuh `paymentStatus=PAID` (409 kalau belum) — kitchen nggak bisa masak order belum bayar
- [x] **`pay` tidak mengubah status lagi** — murni set `PAID` + method + event `order:paid` + audit. `SERVED` dihapus dari enum (migration `prepay_pickup`); COMPLETED hanya via `READY→COMPLETED` (waiter) → inventory deduction jalan di situ
- [x] **Auto table status** (`lib/tableStatus.ts`): status meja = derived dari order/reservasi aktif (OCCUPIED/RESERVED/FREE; OUT_OF_SERVICE tetap manual) — refresh di order create/completed + reservation create/status, emit `table:status` → WAITER/ADMIN (floor view realtime)
- [x] Migration `prepay_pickup` (enum OrderType + OrderStatus, additive untuk MySQL, manual via `migrate diff` karena unique-index warning nolak non-TTY)
- [x] `tests/tableStatus.test.ts` (6 tests) — DINE_IN→OCCUPIED, PICKUP nggak sentuh meja, COMPLETED→FREE, reservasi RESERVED→OCCUPIED→FREE, OUT_OF_SERVICE tak tersentuh
- [x] Tests lama di-update ke model prepay (orders, inventory, notifications, socket) — **105 tests hijau (11 file)**
- Future work: guest checkout online tanpa login (butuh payment/deposit guard biar nggak bisa di-spam), assign-meja-belakangan untuk full-service restaurant

## Fase 7.8 — Guest (Anonymous) QR Ordering ✅ SELESAI

Keputusan: mode 1 via web bisa **anonymous ATAU login** (JWT presence = penentu, nggak ada boolean). Android tetap wajib login (nggak ada perubahan).

- [x] `POST /api/orders` jadi optional-auth — tanpa JWT = guest order, **harus DINE_IN + tableId** (dari QR); PICKUP/TAKEAWAY tetap ranah kasir (guest → 400)
- [x] Kolom `orders.trackingToken` (unique, random 16 hex, migration `tracking_token`) — **guest nggak pernah pakai kode ORD-xxxxx buat tracking/bayar** (sequential = bisa ditebak). Member order juga dapat token (harmless, bisa dipakai tracking web)
- [x] `GET /api/public/orders/:trackingToken` — halaman lacak guest (status, payment, total, items) — notif "digital"-nya adalah halaman ini (guest nggak punya akun)
- [x] `POST /api/public/orders/:token/pay` — guest Pay Now (prepaid, placeholder cashless); guard sama dengan pay biasa (double pay 409, dsb.)
- [x] Refactor: `recordPayment` + `paidEvents` shared oleh pay member & guest (fix race: paidEvents kini awaited)
- [x] ponytail: guest payment nggak masuk audit_logs (actorId FK ke users) — bikin kolom nullable kalau nanti perlu
- [x] ponytail: guest order masih bisa di-spam kalau QR difoto — mitigasi rate-limiting = future work
- [x] `tests/guestOrder.test.ts` (9 tests) — create guest, PICKUP ditolak, track by token, pay by token, paid gate tetap jalan, table tetap OCCUPIED, token unik
- **114 tests hijau (12 file)**

## Fase 7.9 — Regrouping API by Audience ✅ SELESAI

Struktur routes dipecah 3 grup (analogi folder `(group)` di Next.js):

```
src/routes/
├── public.ts   → /api/public   (TANPA auth: menu browse, QR resolve, guest order create/track/pay)
├── me.ts       → /api/me       (JWT semua user: data pribadi — orders, reservations, notifications, profile, avatar)
├── bo.ts       → /api/bo       (JWT + staff gate di MOUNT — orders ops, kasir, menu/staff/tables+QR/inventory/reports/audit)
└── auth.ts     → /api/auth     (register + login publik saja; profile→me, staff→bo)
```

- Satu gate per grup: `/api/bo` ke-mount dengan `requireAuth + requireRole(ADMIN/CHEF/WAITER)` — mustahil ada endpoint backoffice yang lupa diprotect; ADMIN-only tetap ada `requireRole("ADMIN")` per route di dalamnya
- Client mapping: **Android** = `/api/me` + `/api/public` · **Web backoffice** = `/api/bo` (+ `/api/me` buat notif pribadi) · **Menu publik web** = `/api/public` doang
- Order create ada di 3 mount, SATU handler: `/api/public/orders` (optionalAuth — guest/member dari web QR) · `/api/me/orders` (member) · `/api/bo/orders` (kasir)
- `makeUploader`/`uploadErrorHandler` pindah ke `lib/uploads.ts` (infra, dipakai 2 grup); 11 file routes lama → 4 file
- 114 tests di-update ke URL baru — **114/114 hijau**, tsc bersih. Kontrak terbaru di `docs/architecture.md` §API Surface

## Fase 7.10 — Guest Reservation + Best Seller + Slots (dari audit desain "03 Customer Web") ✅ SELESAI

Audit layar Figma page `03 · Customer Web` (11 layar) vs API → 8 layar sudah tercover; 3 ketidaksesuaian diperbaiki:

- [x] **Guest reservation tanpa login** — kolom `reservations.userId` → nullable + `name`/`phone` inline (migration `guest_reservation`)
  - `POST /api/public/reservations` (guest, validasi name+phone wajib; guard unique-index double-booking tetap jalan — dibuktiin test paralel)
  - `GET /api/public/reservations/availability` — kini tanpa login (dipakai form reservasi tamu); `/api/me/reservations/availability` tetap ada buat member
  - Notif reservasi ke customer cuma buat yang punya akun (guest liat konfirmasi di layar)
- [x] **Slots disesuaikan desain**: `11:00, 13:00, 15:00, 18:00, 19:00, 20:00, 21:00` (17:00 dihapus)
- [x] **`menu_items.isFeatured`** — badge ★ Best Seller; admin set via PATCH `/api/bo/menu/:id`; public menu membawa flag
- [x] Konfirmasi: checkout modal desain (PPN 10% + service 5%) = persis `lib/pricing.ts`; modal QRIS/GoPay/DANA/OVO/VA = UI di frontend, backend placeholder pay tetap (gateway asli = future work)
- [x] `tests/guestReservation.test.ts` (7 tests)
- Catatan user: **guest pesan TANPA login tetap didukung** (orders & reservations); tabel `users` tetap ada — register/login wajib untuk Android app + **sistem "poin" (loyalty) = future work**
- **121 tests hijau (13 file)**

## BACKEND SELESAI ✅ — sisa: QA round → web (#8) → android (#9) → deploy belalang

## Setelah fase 7

- QA semua flow via curl/Postman → web (`../web`) → android (`../android`) → deploy belalang

---

**Test accounts** (seed): `admin@ / chef@ / waiter@ / customer@palatia.id`, password `password123`.

**Dev workflow:**
```bash
docker compose -f docker-compose.dev.yml up -d   # DB
npm run dev                                       # server di :4000
docker compose -f docker-compose.dev.yml down     # matiin DB
```