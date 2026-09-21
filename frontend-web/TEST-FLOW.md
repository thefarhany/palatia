# Palatia — TEST-FLOW.md

Skenario isi data + uji flow end-to-end. Kerjakan **berurutan** — tiap babak nyambung ke yang sebelumnya.
Akun: `admin@ / chef@ / waiter@ / customer@palatia.id` — password `password123`.

---

## Babak 1 — Admin: siapkan dapur

> Login sebagai **admin** → masuk ke `/admin`.

1. **Inventory → Tambah Bahan** (`/admin/inventory`)
   Satuan stok gudang bebas (kg / L / botol / pcs) — tersedia saran di datalist.
   Masukkan bahan baku (contoh):
   - `Beras Pandan Wangi` · unit `kg` · stok `120` · reorder `50` · supplier `PT Sumber Pangan`
   - `Ayam Fillet` · unit `kg` · stok `8` · reorder `20` · supplier `PT Sumber Pangan` ← sengaja low stock
   - `Kecap Manis` · unit `botol` · stok `45` · reorder `25` · supplier `CV Makmur`
   - `Minyak Goreng` · unit `L` · stok `30` · reorder `40` · supplier `CV Makmur` ← low stock
   - `Telur` · unit `pcs` · stok `200` · reorder `50` · supplier `PT Sumber Pangan`

   ✅ Cek: banner oranye "2 bahan di bawah reorder level" muncul. Badge **Low Stock** di Ayam Fillet & Minyak Goreng.

2. **Tables → Tambah Meja** (`/admin/tables`)
   Tambah 8 meja: nomor 1–8, kapasitas bebas (mis. 4,4,2,4,6,4,8,2).

3. **Tables → QR** (`/admin/tables`)
   Klik **Lihat QR** di T-01 → pastikan QR + token tampil → **Print PNG** (tab baru) → kembali, klik **Rotate** → buka QR lagi, pastikan token BERUBAH.

4. **Staff → Tambah Staff** (`/admin/staff`)
   - `Rina Kusuma` · `rina@palatia.id` · `password123` · role **Chef**
   - `Sari Dewi` · `sari@palatia.id` · `password123` · role **Waiter**

   ✅ Cek: badge role masing-masing. Coba nonaktifkan diri sendiri (Admin) → **harus ditolak** server (minimal 1 admin aktif).

5. **Menu → Tambah Menu** (`/admin/menu`)
   Buat 5 menu (kategori boleh ketik baru — saran dari datalist):
   - `Nasi Goreng Spesial` · Mains · `28000` · upload foto bebas
   - `Ayam Bakar Madu` · Mains · `45000`
   - `Soto Ayam Lamongan` · Soups · `22000`
   - `Es Teh Manis` · Drinks · `8000`
   - `Es Jeruk Peras` · Drinks · `12000`

   ✅ Cek: kolom **RESEP** semuanya "Belum Ada" dulu.

6. **Menu → Kelola Resep** (`···`)
   Untuk tiap menu, mapping bahan — **input dalam satuan dasar (g/ml/pcs)**,
   dikonversi otomatis ke satuan bahan saat disimpan:
   - Nasi Goreng Spesial: Beras `200` g, Telur `1` pcs, Kecap `20` ml, Minyak `10` ml
   - Ayam Bakar Madu: Ayam Fillet `250` g, Kecap `30` ml
   - Soto Ayam Lamongan: Ayam Fillet `150` g
   - Es Teh Manis: (kosongkan — tak pakai bahan tercatat)
   - Es Jeruk Peras: (kosongkan)

   ✅ Cek: kolom RESEP jadi **"Ada Resep"** (klik badge-nya → dialog view read-only). Es Teh & Es Jeruk tetap "Belum Ada".

7. **Reports & Audit** — buka `/admin/reports` (masih kosong, wajar) dan `/admin/audit` — harusnya ada trail `menu.updated`, `staff.created`, `purchase_order.*`.

---

## Babak 2 — Waiter: order masuk

> Logout → login sebagai **waiter** (`sari@palatia.id`) → `/waiter`.

1. **Floor View** — pastikan grid 8 meja muncul, semua **Free**.
2. **Orders → Order Baru → Dine In**
   - Meja: T-01
   - Items: `2× Nasi Goreng Spesial` (catatan: `sambal terpisah`), `2× Es Teh Manis`
   - Bayar: **Tunai (CASH)** → Buat Order

   ✅ Cek: order muncul `ORD-xxxxx` PAID + Pending di filter Aktif. Floor View T-01 jadi **Occupied** + total.

3. **Orders → Order Baru → Pickup**
   - `1× Ayam Bakar Madu` (catatan: `pedas level 2`), `1× Es Teh Manis`
   - Bayar: **Kartu (CARD_AT_COUNTER)**

   ✅ Cek: row "Pickup" tanpa meja.

4. **Orders → Order Baru (uji gate UNPAID)**
   Buat 1 DINE_IN lagi di T-03 — **JANGAN bayar** (coba kosongkan… sebenarnya modal selalu bayar di muka — jadi ini opsional; kalau mau uji unpaid: buat order lewat API/Postman tanpa `pay`).

   ✅ Cek: tombol **Catat Bayar** muncul; setelah dibayar tombol berganti.

5. **Reservations** — kosong dulu, lanjut Babak 4.

---

## Babak 3 — Chef: masak

> Logout → login sebagai **chef** (`rina@palatia.id`) → `/kitchen`.

1. **Board NEW** — order `ORD-xxxxx` dari Babak 2 muncul **tanpa refresh** (socket live).
2. Klik **Mulai Masak** → pindah ke PREPARING.
3. Klik **Mark Ready** → pindah ke READY.

   ✅ Cek: kartu UNPAID (kalau ada) tampak redup + tombol disabled **"Menunggu Pembayaran"** — tidak bisa dimasak.

4. **Notifikasi** — bell di kanan atas → harusnya ada **"Order baru"** dari Babak 2.

---

## Babak 4 — Waiter: selesaikan & billing

> Login kembali sebagai **waiter**.

1. **Orders** — order READY muncul otomatis (socket). Klik **Selesaikan** pada order DINE_IN (T-01).

   ✅ Cek: stok terpotong! Buka (admin)/inventory: Beras `120 → 119.6` kg (2 porsi × 200 g = 0.4 kg), Telur `200 → 198` pcs, dst.
   ⚠️ Kalau Ayam Fillet jadi di bawah reorder level → notif "Stok menipis" untuk admin.

2. **Pickup Display** (`/waiter/pickup`) — order PICKUP yang READY tampil besar di layar. Klik Selesaikan dari Orders untuk menutupnya.

3. **Billing** (`/waiter/billing`)
   - Pilih order selesai/aktif → detail item + catatan tampil.
   - Isi **Diskon** `5000` → TOTAL turun (server recompute).
   - Klik **Cetak Invoice** → struk auto-print di tab baru.

4. **Reservations → buat reservasi manual?** Reservasi dibuat dari customer (Babak 5). Di halaman ini nanti tinggal **Confirm → Seat → Complete**.

---

## Babak 5 — Customer: reservasi (dan tracking)

> Logout → login sebagai **customer** (`customer@palatia.id`).

1. Landing → diarahkan ke `/menu` (public menu). Browse, search.
2. **Reservasi**: pilih tanggal besok → slot `19:00` → guests `4` → pilih meja yang Free → reservasi.

   ✅ Cek: notif "Reservasi baru" ke waiter. Waiter: Confirm → Seat → Complete di `/waiter/reservations`. Floor view meja jadi Reserved lalu bebas lagi.

3. **Order member + tracking** (kalau halaman customer order sudah dibangun):
   - Order dari menu → bayar "Pay Now" → track status live.

---

## Babak 6 — Cek silang akhir

- `/admin` (dashboard): TODAY'S SALES, ORDERS, RESERVATIONS, LOW STOCK — semua angka nyambung dengan transaksi di atas.
- `/admin/audit`: trail lengkap (order.status, payment, purchase, staff, menu).
- `/admin/inventory`: cek stok konsisten setelah semua order COMPLETED.
- Notif: admin harus punya "Stok menipis" (dari Ayam Fillet), waiter punya "Reservasi baru".

---

## Checklist cepat (copy-paste)

- [ ] Babak 1 — bahan + meja + QR + staff + menu + resep
- [ ] Babak 2 — waiter: dine-in (paid) + pickup
- [ ] Babak 3 — chef: masak sampai READY (live, tanpa refresh)
- [ ] Babak 4 — waiter: complete + stok terpotong + diskon + cetak invoice
- [ ] Babak 5 — customer: reservasi + seat flow
- [ ] Babak 6 — dashboard, audit, stok, notif konsisten