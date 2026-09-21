# Palatia — Use Cases

## Actors

- **Customer** (guest or registered; ordering requires an account unless placing DINE_IN from table QR, menu browsing is public)
- **Waiter** (staff)
- **Chef** (staff)
- **Admin** (staff)
- **System** (inventory deduction, notifications, schedulers)

## Use Cases

### Authentication & Access Guard

| ID | Use Case | Actor |
|---|---|---|
| UC-01 | Register account (customer role by default) | Customer |
| UC-02 | Log in / log out; receive JWT | All |
| UC-03 | Access enforced per role (RBAC middleware rejects unauthorized role; `requireCustomer` blocks staff customer transactions) | System |
| UC-03b | Browse public customer pages in Read-Only mode with StaffTopBanner notification | Staff (Admin, Chef, Waiter) |

### Menu & PWA

| ID | Use Case | Actor |
|---|---|---|
| UC-04 | Browse menu with search, category filter, availability, and Best Seller badges | Customer (public) |
| UC-05 | Create / update / toggle availability / delete menu item | Admin |
| UC-05b | Slugified upload image filenames (`<slug>.<ext>`) & auto-cleanup of obsolete disk image files on replace/delete | System, Admin |
| UC-06 | Scan table QR → public menu opens pre-bound to that table; admin prints QR PNG per table and can rotate (revoke) it | Customer, Admin |

### Reservation

| ID | Use Case | Actor |
|---|---|---|
| UC-07 | View table availability by date & time slot (real-time) | Customer |
| UC-08 | Create reservation (date, slot, party size) — rejected if slot taken (DB constraint) | Customer |
| UC-09 | Confirm / seat / complete / cancel reservation | Waiter |
| UC-10 | Manage tables (add table, set capacity/status) | Admin |

### Ordering & Kitchen

| ID | Use Case | Actor |
|---|---|---|
| UC-11 | Add items to cart with quantity & notes (150-char limit); place order (dine-in/takeaway) | Customer |
| UC-12 | Create order on behalf of a customer: DINE_IN (with table) or PICKUP/TAKEAWAY (counter, tableless) | Waiter |
| UC-13 | View incoming paid order queue (real-time) | Chef |
| UC-14 | Update order status: PREPARING → READY (paid orders only) | Chef |
| UC-14b | Update order status: READY → SERVED → COMPLETED | Waiter |
| UC-14c | Browse Chef Recipe Catalog (`/kitchen/recipe`) with 6-card grid, search/filter, pop-up recipe modal, cooking unit conversions (`gram`/`ml`), and numbered list styling | Chef |
| UC-15 | Track own order status (PWA & Web: Socket.IO / token polling) | Customer |
| UC-16 | Cancel order (only before PREPARING) | Customer, Waiter |

### Billing

| ID | Use Case | Actor |
|---|---|---|
| UC-17 | Generate invoice (subtotal, GST tax 10%, service charge 5%, discount, grand total) | System |
| UC-18 | Apply discount to an invoice in Billing Modal | Waiter, Admin |
| UC-19 | View Billing Table & Record payment as CASH / CARD_AT_COUNTER in Receipt Modal (prepaid — kitchen gate opens) | Waiter, Admin |
| UC-20 | Print / export invoice via standalone `/print/invoice?order=id` route | Waiter, Customer |

### Inventory

| ID | Use Case | Actor |
|---|---|---|
| UC-21 | Manage ingredients (stock, unit, reorder level, supplier) | Admin |
| UC-22 | Auto-deduct ingredient stock when an order completes (via recipe mapping) | System |
| UC-23 | Receive low-stock notification | Admin |
| UC-24 | Create / receive purchase orders (receiving raises stock) | Admin |

### Administration & Reports

| ID | Use Case | Actor |
|---|---|---|
| UC-25 | Manage staff accounts (create, assign role, deactivate) | Admin |
| UC-26 | View daily sales & popular dishes reports | Admin |
| UC-27 | View audit log of sensitive actions | Admin |

### Notifications, PWA & UX

| ID | Use Case | Actor |
|---|---|---|
| UC-28 | Receive in-app notifications (reservation confirmed, order status, payment recorded, low stock, new kitchen order) | All, per relevance |
| UC-29 | Render custom customer-themed 404 Not Found page for invalid routes | All |
| UC-30 | Install Progressive Web App (PWA) to home screen with offline asset caching | Customer, Staff |