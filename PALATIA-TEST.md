# Palatia Restaurant & Coffee Lounge — Data Uji & Panduan Input Backoffice

Dokumen ini berisi daftar data sampel **Coffee Shop & Fine Dining Fusion** yang siap di-input satu-per-satu lewat **Backoffice Palatia** (`/admin`).

Menu mencakup perpaduan makanan & minuman dari **Affordable Everyday** hingga **High-End Signature**, yang terbagi dalam 4 kategori (masing-masing 5 menu = Total 20 Menu).

---

## 📌 Urutan Pengisian Data Terbaik
Agar pengisian data berjalan lancar (karena resep menu memerlukan bahan baku yang sudah terdaftar), lakukan pengisian dengan urutan berikut:
1. **Bahan Baku (Inventory)** → `/admin/inventory`
2. **Meja Restoran (Tables)** → `/admin/tables`
3. **Tambah Staff (Opsional)** → `/admin/staff`
4. **Daftar Menu (Menu)** → `/admin/menu`
5. **Mapping Resep Menu** → Tombol `Lihat / + Tambah Resep` pada daftar menu

---

## 1. Data Bahan Baku (Inventory) — `/admin/inventory`

Masukan bahan-bahan baku berikut ke dalam inventory gudang:

| Nama Bahan | Satuan | Stok Awal | Reorder Level | Nama Supplier | No. HP Supplier | Status/Catatan |
| :--- | :---: | :---: | :---: | :--- | :--- | :--- |
| **Beras Organik** | `kg` | `100` | `20` | PT Sumber Pangan Utama | 081299887766 | Stok Aman |
| **Daging Sapi Wagyu** | `kg` | `10` | `5` | PT Premium Beef Import | 081122334455 | High-End Item |
| **Daging Sapi Slice** | `kg` | `25` | `10` | PT Meat Jaya | 081155667788 | Stok Aman |
| **Salmon Fillet** | `kg` | `8` | `10` | Norway Seafood Express | 081988776655 | ⚠️ *Low Stock* |
| **Ayam Fillet** | `kg` | `15` | `20` | CV Chicken Fresh | 081311223344 | ⚠️ *Low Stock* |
| **Sayap Ayam** | `kg` | `12` | `5` | CV Chicken Fresh | 081311223344 | Stok Aman |
| **Udang Vaname** | `kg` | `10` | `5` | Marine Fresh Seafood | 081744332211 | Stok Aman |
| **Cumi-cumi Segar** | `kg` | `8` | `4` | Marine Fresh Seafood | 081744332211 | Stok Aman |
| **Spaghetti Pasta** | `kg` | `15` | `5` | PT Italia Food Import | 081244556677 | Stok Aman |
| **Minyak Goreng** | `L` | `30` | `15` | CV Makmur Abadi | 081822334455 | Stok Aman |
| **Minyak Truffle** | `L` | `2` | `1` | Gourmet Italy Co. | 081199887766 | High-End Item |
| **Mentega Butter** | `kg` | `12` | `5` | French Dairy Co. | 081544332211 | Stok Aman |
| **Kentang Premium** | `kg` | `40` | `15` | Farm Fresh Potato | 081355667788 | Stok Aman |
| **Roti Baguette** | `pcs` | `30` | `10` | Artisan Bakery House | 081266778899 | Stok Aman |
| **Jamur Champignon** | `kg` | `6` | `3` | Fresh Veggie Land | 081788990011 | Stok Aman |
| **Pisang Raja** | `kg` | `20` | `5` | Toko Buah Nusantara | 081399887766 | Stok Aman |
| **Telur Ayam** | `pcs` | `200` | `50` | Peternakan Barokah | 081977665544 | Stok Aman |
| **Tepung Terigu** | `kg` | `25` | `10` | PT Bogasari Utama | 081211223344 | Stok Aman |
| **Tepung Tapioka** | `kg` | `15` | `5` | PT Bogasari Utama | 081211223344 | Stok Aman |
| **Kopi Arabika Beans**| `kg` | `10` | `3` | Kopi Nusantara Co. | 081233445566 | Stok Aman |
| **Teh Premium Loose** | `kg` | `5` | `2` | Teh Cap Botol Mas | 081566778899 | Stok Aman |
| **Bubuk Matcha Uji** | `kg` | `3` | `1` | Kyoto Import Co. | 081877665544 | High-End Item |
| **Cokelat Belgia Powder**| `kg` | `5` | `2` | Belgian Choco Corp | 081966778899 | Stok Aman |
| **Susu UHT Full Cream**| `L` | `40` | `10` | PT Milk Java | 081688990011 | Stok Aman |
| **Kental Manis** | `L` | `15` | `5` | PT Milk Java | 081688990011 | Stok Aman |
| **Keju Mozzarella** | `kg` | `8` | `10` | Indo Cheese Craft | 081433221100 | ⚠️ *Low Stock* |

---

## 2. Data Meja Restoran (Tables) — `/admin/tables`

| Nomor Meja | Kapasitas | Area / Peruntukan |
| :---: | :---: | :--- |
| **T-01** | `2` Orang | Indoor Coffee Lounge |
| **T-02** | `2` Orang | Indoor Coffee Lounge |
| **T-03** | `4` Orang | Main Dining Room |
| **T-04** | `4` Orang | Main Dining Room |
| **T-05** | `4` Orang | Terrace Semi-Outdoor |
| **T-06** | `4` Orang | Terrace Semi-Outdoor |
| **T-07** | `6` Orang | Outdoor Garden Lounge |
| **T-08** | `6` Orang | Outdoor Garden Lounge |
| **T-09** | `8` Orang | Fine Dining VIP Room A |
| **T-10** | `10` Orang | Fine Dining VIP Room B |

---

## 3. Data Menu & Mapping Resep — `/admin/menu`

Input 20 menu berikut (5 menu per kategori):

### A. Kategori: `Main Course` (5 Menu)

1. **Nasi Goreng Wagyu Truffle** *(★ Signature High-End)*
   - **Harga**: Rp 85.000
   - **Deskripsi**: Nasi goreng rempah istimewa dengan saikoro steak Wagyu MB5 dan minyak truffle aromatik.
   - **Resep Mapping**:
     - `Beras Organik`: `200 g` (0.2 kg)
     - `Daging Sapi Wagyu`: `120 g` (0.12 kg)
     - `Telur Ayam`: `1 pcs`
     - `Minyak Truffle`: `10 ml` (0.01 L)
     - `Minyak Goreng`: `15 ml` (0.015 L)

2. **Pan-Seared Atlantic Salmon** *(★ Signature High-End)*
   - **Harga**: Rp 125.000
   - **Deskripsi**: Salmon fillet panggang dengan kulit crispy disajikan dengan saus lemon butter dan creamy mashed potato.
   - **Resep Mapping**:
     - `Salmon Fillet`: `180 g` (0.18 kg)
     - `Kentang Premium`: `150 g` (0.15 kg)
     - `Mentega Butter`: `30 g` (0.03 kg)
     - `Susu UHT Full Cream`: `50 ml` (0.05 L)

3. **Spaghetti Creamy Carbonara** *(Middle Favorite)*
   - **Harga**: Rp 48.000
   - **Deskripsi**: Pasta spaghetti autentik dengan saus krim gurih, smoked beef slice, dan taburan keju parmesan.
   - **Resep Mapping**:
     - `Spaghetti Pasta`: `120 g` (0.12 kg)
     - `Daging Sapi Slice`: `50 g` (0.05 kg)
     - `Susu UHT Full Cream`: `100 ml` (0.1 L)
     - `Keju Mozzarella`: `30 g` (0.03 kg)

4. **Nasi Ayam Bakar Madu** *(Affordable Popular)*
   - **Harga**: Rp 38.000
   - **Deskripsi**: Ayam bakar lembut bumbu rempah dioles madu murni, disajikan lengkap dengan nasi hangat.
   - **Resep Mapping**:
     - `Ayam Fillet`: `220 g` (0.22 kg)
     - `Beras Organik`: `200 g` (0.2 kg)
     - `Minyak Goreng`: `15 ml` (0.015 L)

5. **Ayam Geprek Sambal Korek** *(Affordable Everyday)*
   - **Harga**: Rp 28.000
   - **Deskripsi**: Ayam crispy digeprek dengan sambal korek bawang pedas membakar, disajikan lengkap dengan nasi.
   - **Resep Mapping**:
     - `Ayam Fillet`: `180 g` (0.18 kg)
     - `Beras Organik`: `200 g` (0.2 kg)
     - `Tepung Terigu`: `50 g` (0.05 kg)
     - `Minyak Goreng`: `40 ml` (0.04 L)

---

### B. Kategori: `Beverage` (5 Menu)

6. **Matcha Espresso Fusion** *(★ Signature Specialty)*
   - **Harga**: Rp 42.000
   - **Deskripsi**: Perpaduan layer gradasi Uji Matcha Kyoto premium, fresh milk, dan single shot espresso Arabika.
   - **Resep Mapping**:
     - `Bubuk Matcha Uji`: `15 g` (0.015 kg)
     - `Kopi Arabika Beans`: `9 g` (0.009 kg)
     - `Susu UHT Full Cream`: `150 ml` (0.15 L)

7. **Spanish Latte Signature** *(Signature Coffee)*
   - **Harga**: Rp 38.000
   - **Deskripsi**: Double shot espresso Arabika racikan house blend dipadu susu kental manis dan fresh milk creamy.
   - **Resep Mapping**:
     - `Kopi Arabika Beans`: `18 g` (0.018 kg)
     - `Susu UHT Full Cream`: `150 ml` (0.15 L)
     - `Kental Manis`: `30 ml` (0.03 L)

8. **Artisan Belgian Chocolate** *(Middle Non-Coffee)*
   - **Harga**: Rp 35.000
   - **Deskripsi**: Cokelat Belgia pekat kualitas artisan yang di-steam lembut dengan fresh milk hangat atau dingin.
   - **Resep Mapping**:
     - `Cokelat Belgia Powder`: `30 g` (0.03 kg)
     - `Susu UHT Full Cream`: `180 ml` (0.18 L)

9. **Iced Americano** *(Affordable Classic)*
   - **Harga**: Rp 22.000
   - **Deskripsi**: Double shot espresso pilihan disajikan dingin, memberikan cita rasa kopi murni yang segar.
   - **Resep Mapping**:
     - `Kopi Arabika Beans`: `18 g` (0.018 kg)

10. **Es Teh Manis Jasmine** *(Affordable Everyday)*
    - **Harga**: Rp 10.000
    - **Deskripsi**: Teh melati wangi diproses seduh dingin dengan gula tebu asli.
    - **Resep Mapping**:
      - `Teh Premium Loose`: `10 g` (0.01 kg)

---

### C. Kategori: `Side Dish` (5 Menu)

11. **Truffle Parmesan Fries** *(★ Signature Side)*
    - **Harga**: Rp 38.000
    - **Deskripsi**: Kentang goreng impor renyah dibalur minyak truffle asli dan taburan keju parmesan gurih.
    - **Resep Mapping**:
      - `Kentang Premium`: `180 g` (0.18 kg)
      - `Keju Mozzarella`: `25 g` (0.025 kg)
      - `Minyak Truffle`: `10 ml` (0.01 L)
      - `Minyak Goreng`: `50 ml` (0.05 L)

12. **Sauteed Mushroom & Butter** *(Middle Healthy Side)*
    - **Harga**: Rp 28.000
    - **Deskripsi**: Jamur champignon tumis mentega gurih dengan bumbu merica hitam halus.
    - **Resep Mapping**:
      - `Jamur Champignon`: `150 g` (0.15 kg)
      - `Mentega Butter`: `20 g` (0.02 kg)
      - `Minyak Goreng`: `10 ml` (0.01 L)

13. **Creamy Mashed Potato** *(Middle Side)*
    - **Harga**: Rp 25.000
    - **Deskripsi**: Tumbukan kentang lembut bertekstur velvety yang dimasak dengan butter Prancis dan heavy cream.
    - **Resep Mapping**:
      - `Kentang Premium`: `200 g` (0.2 kg)
      - `Mentega Butter`: `30 g` (0.03 kg)
      - `Susu UHT Full Cream`: `40 ml` (0.04 L)

14. **Garlic Bread Baguette** *(Affordable Side)*
    - **Harga**: Rp 22.000
    - **Deskripsi**: Roti baguette panggang mentega bawang putih dengan aroma rempah peterseli yang menggugah selera.
    - **Resep Mapping**:
      - `Roti Baguette`: `1 pcs`
      - `Mentega Butter`: `20 g` (0.02 kg)

15. **French Fries Classic** *(Affordable Popular)*
    - **Harga**: Rp 18.000
    - **Deskripsi**: Kentang goreng potong tebal yang digoreng hingga keemasan disajikan dengan saus cocolan.
    - **Resep Mapping**:
      - `Kentang Premium`: `150 g` (0.15 kg)
      - `Minyak Goreng`: `50 ml` (0.05 L)

---

### D. Kategori: `Snack` (5 Menu)

16. **Calamari Ring Salt & Pepper** *(★ Signature Snack)*
    - **Harga**: Rp 45.000
    - **Deskripsi**: Ring cumi-cumi segar goreng tepung seasoning garam merica disajikan dengan tartar dip.
    - **Resep Mapping**:
      - `Cumi-cumi Segar`: `150 g` (0.15 kg)
      - `Tepung Terigu`: `50 g` (0.05 kg)
      - `Minyak Goreng`: `60 ml` (0.06 L)

17. **Chicken Wings Honey BBQ** *(Middle Popular Snack)*
    - **Harga**: Rp 36.000
    - **Deskripsi**: Sayap ayam goreng renyah dibalut saus Honey BBQ gurih manis yang melimpah.
    - **Resep Mapping**:
      - `Sayap Ayam`: `200 g` (0.2 kg)
      - `Tepung Terigu`: `30 g` (0.03 kg)
      - `Minyak Goreng`: `50 ml` (0.05 L)

18. **Crispy Mozzarella Sticks** *(Middle Favorite Snack)*
    - **Harga**: Rp 32.000
    - **Deskripsi**: Keju mozzarella impor dibalut tepung roti crispy yang meleleh saat digigit.
    - **Resep Mapping**:
      - `Keju Mozzarella`: `120 g` (0.12 kg)
      - `Tepung Terigu`: `30 g` (0.03 kg)
      - `Minyak Goreng`: `40 ml` (0.04 L)

19. **Pisang Goreng Keju Cokelat** *(Affordable Coffee Shop)*
    - **Harga**: Rp 22.000
    - **Deskripsi**: Pisang raja manis goreng tepung crispy dengan topping parutan keju dan kental manis cokelat.
    - **Resep Mapping**:
      - `Pisang Raja`: `150 g` (0.15 kg)
      - `Tepung Terigu`: `40 g` (0.04 kg)
      - `Keju Mozzarella`: `20 g` (0.02 kg)
      - `Minyak Goreng`: `30 ml` (0.03 L)

20. **Cireng Bumbu Rujak** *(Affordable Local Snack)*
    - **Harga**: Rp 16.000
    - **Deskripsi**: Cireng kenyal renyah ala nusantara yang disajikan hangat lengkap dengan cocolan saus rujak pedas manis.
    - **Resep Mapping**:
      - `Tepung Tapioka`: `100 g` (0.1 kg)
      - `Minyak Goreng`: `40 ml` (0.04 L)
