# Palatia — REST API & WebSocket Contract

The Palatia backend exposes a single REST API surface alongside a Socket.IO WebSocket server. All HTTP requests consume and return `application/json`. Auth is governed via **Bearer JWT Tokens**.

---

## 🔐 Authentication & Headers

```http
Authorization: Bearer <jwt_access_token>
Content-Type: application/json
```

### Roles Matrix
- `ADMIN`: Full system control.
- `CHEF`: Kitchen Display System & Chef Recipe Catalog read access.
- `WAITER`: Floor table management, order status update, billing, and receipt printing.
- `CUSTOMER`: Public guest & member ordering, tracking, and table reservations.

---

## 🌐 1. Public API Surface (`/api/public`)

Mounted without authentication requirements (guest accessible).

### `GET /api/public/menu`
Fetch public menu catalog.
- **Query Params**: `available` (`true`/`false`), `category` (optional), `q` (search string).
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": 7,
      "name": "Nasi Goreng Wagyu",
      "category": "Main Course",
      "description": "Nasi goreng dengan potongan daging wagyu pilihan.",
      "price": "45000.00",
      "available": true,
      "isFeatured": true,
      "imageUrl": "/uploads/menu/nasi-goreng-wagyu.jpg"
    }
  ]
}
```

### `GET /api/public/menu/categories`
Fetch distinct menu categories.
- **Response `200 OK`**:
```json
{
  "categories": ["Main Course", "Beverage", "Snack", "Side Dish"]
}
```

### `GET /api/public/table/:token`
Resolve table details from a scanned QR token.
- **Response `200 OK`**:
```json
{
  "table": {
    "id": 2,
    "number": 5,
    "capacity": 4,
    "status": "FREE"
  }
}
```

### `POST /api/public/orders`
Place a guest order (DINE_IN via table QR or TAKEAWAY).
- **Request Body**:
```json
{
  "type": "DINE_IN",
  "tableId": 2,
  "items": [
    { "menuItemId": 7, "qty": 2, "notes": "Pedas manis, tanpa daun bawang" }
  ]
}
```
- **Response `201 Created`**:
```json
{
  "order": {
    "id": 104,
    "code": "ORD-9X1Y",
    "trackingToken": "tr_8a7f9b2c3d4e5f6g",
    "type": "DINE_IN",
    "status": "PENDING",
    "paymentStatus": "UNPAID",
    "subtotal": "90000.00",
    "tax": "9000.00",
    "serviceCharge": "4500.00",
    "total": "103500.00"
  }
}
```

### `GET /api/public/orders/:trackingToken`
Track guest order status via unguessable token.
- **Response `200 OK`**:
```json
{
  "order": {
    "code": "ORD-9X1Y",
    "status": "PREPARING",
    "paymentStatus": "PAID",
    "items": [
      { "qty": 2, "notes": "Pedas manis", "menuItem": { "name": "Nasi Goreng Wagyu" } }
    ]
  }
}
```

### `POST /api/public/orders/:trackingToken/pay`
Pay guest order upfront.
- **Response `200 OK`**:
```json
{
  "order": {
    "code": "ORD-9X1Y",
    "paymentStatus": "PAID",
    "paymentMethod": "CARD_AT_COUNTER"
  }
}
```

### `GET /api/public/reservations/availability`
Check real-time table slot availability.
- **Query Params**: `date` (`YYYY-MM-DD`), `timeSlot` (`11:00`..."21:00").
- **Response `200 OK`**:
```json
{
  "availableTables": [
    { "id": 1, "number": 1, "capacity": 2 },
    { "id": 3, "number": 3, "capacity": 4 }
  ]
}
```

---

## 🔑 2. Customer & Profile API (`/api/me`)

Mounted with `JWT` requirement (`requireCustomer` middleware for transactions).

### `GET /api/me/profile`
Fetch current logged-in user profile.
- **Response `200 OK`**:
```json
{
  "user": {
    "id": 12,
    "name": "Budi Customer",
    "email": "budi@palatia.id",
    "role": "CUSTOMER"
  }
}
```

### `POST /api/me/reservations`
Create a customer table reservation.
- **Request Body**:
```json
{
  "tableId": 3,
  "date": "2026-09-25",
  "timeSlot": "18:00",
  "guests": 4
}
```
- **Response `201 Created`**: Returns created reservation payload.
- **Response `409 Conflict`**: `"Table slot already reserved."` (DB Constraint).

---

## 👨‍🍳 3. Backoffice Staff API (`/api/bo`)

Mounted with `JWT` + Staff Role Requirements (`ADMIN`, `CHEF`, `WAITER`).

### `GET /api/bo/orders`
Fetch orders queue.
- **Role Access**: `CHEF` (receives `paymentStatus: PAID` orders only), `WAITER`, `ADMIN`.
- **Response `200 OK`**: List of active orders with table, status, and items.

### `PATCH /api/bo/orders/:id/status`
Update order lifecycle state.
- **Role Access**: `CHEF` (`PENDING` $\rightarrow$ `PREPARING` $\rightarrow$ `READY`), `WAITER` (`READY` $\rightarrow$ `SERVED` $\rightarrow$ `COMPLETED`).
- **Request Body**:
```json
{ "status": "PREPARING" }
```
- **Response `200 OK`**: Returns updated order.

### `GET /api/bo/menu`
Fetch admin menu list with recipe counts.
- **Role Access**: `ADMIN`, `CHEF`.
- **Response `200 OK`**:
```json
{
  "items": [
    {
      "id": 7,
      "name": "Nasi Goreng Wagyu",
      "category": "Main Course",
      "price": "45000.00",
      "available": true,
      "imageUrl": "/uploads/menu/nasi-goreng-wagyu.jpg",
      "_count": { "recipeItems": 3 }
    }
  ]
}
```

### `GET /api/bo/inventory/recipes/:menuItemId`
Fetch recipe ingredients for a dish (used in Chef Recipe Modal & Admin Recipe Editor).
- **Role Access**: `ADMIN`, `CHEF`.
- **Response `200 OK`**:
```json
{
  "recipe": [
    {
      "id": 101,
      "menuItemId": 7,
      "ingredientId": 14,
      "qty": "0.2000",
      "ingredient": {
        "name": "Daging Wagyu",
        "unit": "kg"
      }
    },
    {
      "id": 102,
      "menuItemId": 7,
      "ingredientId": 22,
      "qty": "0.0500",
      "ingredient": {
        "name": "Minyak Goreng",
        "unit": "L"
      }
    }
  ]
}
```

### `POST /api/bo/uploads/menu`
Upload menu image file.
- **Role Access**: `ADMIN`.
- **Headers**: `Content-Type: multipart/form-data`
- **Form Data**: `name` ("Ayam Geprek"), `file` (Binary image file).
- **Response `201 Created`**:
```json
{
  "url": "/uploads/menu/ayam-geprek.jpg"
}
```
*Note*: Automatically cleans up obsolete files from disk if replacing an existing menu item image.

---

## ⚡ 4. Socket.IO Real-Time Events

WebSocket connection: `ws://api-palatia.thefarhany.xyz`

| Event Name | Sender | Payload | Audience / Room | Description |
|---|---|---|---|---|
| `order:created` | Server | Order DTO | `role:kitchen`, `role:admin` | Emitted when payment is placed. |
| `order:status` | Server | `{ orderId, status }` | `order:{id}`, `role:waiter`, `role:admin` | Live order lifecycle transition. |
| `order:paid` | Server | `{ orderId }` | `order:{id}`, Staff roles | Order payment confirmed. |
| `inventory:low` | Server | `{ ingredientId, stock }` | `role:admin` | Triggered when ingredient falls below reorder level. |
