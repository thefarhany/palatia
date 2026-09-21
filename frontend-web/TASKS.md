# Palatia Web — Task List

Acuan: docs/PRD.md, docs/user-flows.md (role × feature matrix #7), server/src routes.
Peran web: **staff dashboards** (ADMIN/CHEF/WAITER) + **public** (menu, QR menu, guest tracking).

## 0. Fondasi

- [x] Route groups: `(public)` (menu, login, track) vs `(backoffice)` (admin/waiter/kitchen) — URL tak berubah
- [x] Setup: shadcn/ui init (Tailwind v4, radix-nova), design tokens (neutral + indigo), dark mode siap
- [x] API client: RSC `apiFetch` (token dari cookie) + BFF proxy `/api/proxy/*` untuk browser
- [x] Auth: login staff `/login/staff` + login customer `/login` (shared `LoginForm` variant), httpOnly cookie, logout
- [x] Proxy guard `/admin|/waiter|/kitchen` (optimistic) + role gate di layout (server-verified via `/auth/me`)
- [x] Socket.IO provider (`SocketProvider`, token dari RSC — httpOnly tidak bocor ke storage)
- [x] Layout staff: sidebar gelap (#1a1d23) sesuai Figma 6:33 — brand Palatia, nav aktif indigo, user card + logout, topbar putih + tombol bell
- [x] Admin Dashboard (/admin) sesuai Figma 6:32: 4 stat card, Popular Dishes (bar CSS), Recent Orders — data live dari reports/orders/inventory/reservations/tables
- [ ] Register (customer) — pending, bersama section 1 public

## 1. Public (customer, no login / optional)

- [ ] Landing/menu publik: search, filter kategori, badge availability — `/menu`
- [ ] Menu via QR: `/menu?t=<token>` → resolve `GET /api/public/table/:token` → banner "Table N"
- [ ] Cart + checkout (qty, notes per item, type DINE_IN/PICKUP/TAKEAWAY)
  - login optional: guest hanya DINE_IN dari QR → dapat trackingToken
- [ ] Tracking page guest: `/track/<token>` — status live (Socket.IO room `order:{id}` / poll fallback), tombol Pay Now
- [ ] Invoice view (customer own)

## 2. Kitchen (CHEF — single screen)

- [x] Live queue 3 kolom NEW/PREPARING/READY sesuai Figma 3:60 — realtime `order:created|status|paid`
- [x] Aksi: Mulai Masak (PENDING+PAID → PREPARING), Mark Ready (→ READY)
- [x] Gate UI: UNPAID = kartu redup + tombol disabled "Menunggu Pembayaran"; READY = "Tunggu Waiter"
- [x] Server: `orderInclude` kini membawa nama menu item (dipakai semua response order)

## 3. Waiter

- [x] Floor view: grid meja FREE/RESERVED/OCCUPIED/OUT_OF_SERVICE — realtime `table:status` — UI done (legend count, kartu meja + total open order + tombol Buat Invoice, badge reservasi hari ini), tinggal QA visual
- [ ] Reservasi: daftar hari ini, aksi confirm/seat/complete/cancel — realtime `reservation:*` — UI done (filter hari ini/besok/minggu ini, tabel + aksi sesuai transisi server), tinggal QA visual
- [ ] Buat order atas nama customer: DINE_IN (pilih meja) / PICKUP — record payment CASH/CARD_AT_COUNTER — UI done (halaman orders + modal order baru dua tipe + bayar di muka), tinggal QA visual
- [ ] Pickup display: order code READY di counter — done (layar gelap gaya kitchen display, kode besar, live socket, clock + LIVE pill); tanpa mock Figma, desain minimal
- [ ] Serve/hand-over: READY → COMPLETED
- [ ] Billing: invoice page print-friendly (`window.print()`), apply discount, record payment — UI done (order picker, rincian item + catatan, panel pembayaran + diskon + metode, print sheet `/print/invoice`), tinggal QA visual
- [ ] Cancel order (sebelum PREPARING)

## 4. Admin

- [x] Dashboard ringkas (angka hari ini: sales, orders, low stock)
- [ ] Menu CRUD + image upload + toggle availability — UI done (list, search, filter kategori, create/edit modal + upload foto, kelola resep modal, delete confirm), tinggal QA visual
- [ ] Staff management: create, assign role, deactivate — UI done (list + badge, tambah/edit staff, nonaktifkan/aktifkan), server: GET/PATCH /auth/staff baru + guard "minimal 1 admin aktif", tinggal QA visual
- [ ] Tables: CRUD + QR print (`GET /api/tables/:id/qr.png`) + rotate token — UI done (list, tambah/edit meja, modal QR + rotate, print sheet A4 `/print/qr-sheet`), tinggal QA visual
- [ ] Inventory: ingredients CRUD, reorder level, purchase orders (create/receive) — UI done (banner low stock, tabel bahan, modal bahan, modal PO + total live, daftar PO + receive), tinggal QA visual
- [ ] Reports: daily sales + popular dishes (tanpa chart lib — bar CSS cukup) — UI done (4 stat card, bar chart 7 hari, menu terpopuler), tinggal QA visual
- [ ] Audit log (read-only) — UI done (tabel WAKTU/PENGGUNA/AKSI/DETAIL, badge warna per keluarga aksi, detail human-readable dari meta), tinggal QA visual
- [ ] Reservation & order monitor (semua data, read)

## 5. Notifikasi

- [ ] Bell + dropdown: `GET /api/notifications`, `PATCH /:id/read`, realtime `notification`
- [ ] Konten per role sesuai matrix #7 #19

## 6. Polish

- [ ] Dark mode, loading/error states, empty states
- [ ] Responsive (staff = desktop-first, public = mobile-first)
- [ ] Build production + standalone output (deploy Docker)