# AquaHome Order Flow Documentation

## Overview
This document describes the complete flow of a water delivery order from customer registration to final delivery verification.

## 1. Customer Registration & Authentication

### Flow:
```
User Registration
    ↓
Email Verification
    ↓
Login to Customer Dashboard
    ↓
Profile Setup (Address, Phone)
```

### Key Points:
- Users register with email and password
- Email verification is required (handled by Supabase Auth)
- User profile automatically created in `profiles` table
- User role automatically assigned as "customer"

**Audit Log**: `user_registered` event logged

---

## 2. Product Browsing & Selection

### Flow:
```
Customer Dashboard
    ↓
Browse Products
    ↓
Enter Pincode/Use GPS
    ↓
View Filtered Products (By Category, Supplier)
    ↓
Add Product to Cart
```

### Features:
- **Location-based filtering**: Shows 1 product per supplier per category
- **Real product images**: Uses Unsplash CDN images based on category
- **Delivery estimation**: Shows ETA based on supplier pincode
- **Stock tracking**: Displays current stock availability
- **Supplier ratings**: Shows supplier ratings and reviews

### Product Categories:
- Bottles (500ml - 2L)
- Cans (20L)
- Jars (5L - 10L)
- Tankers (500L - 1000L)

---

## 3. Order Placement

### Flow:
```
View Cart
    ↓
Select Delivery Address
    ↓
Enter Pincode (for supplier matching)
    ↓
Select Order Type (Can/Tanker)
    ↓
Select Quantity
    ↓
Review Order Details
    ↓
Place Order
    ↓
Payment Processing
```

### Order Status: `placed`

**Database Entry**:
```
orders table:
{
  id: UUID
  customer_id: UUID
  supplier_id: UUID
  quantity: INT
  total_amount: NUMERIC
  status: 'placed'
  delivery_address: TEXT
  otp_code: NULL
  otp_generated_at: NULL
  otp_verified: FALSE
  created_at: TIMESTAMP
}
```

**Audit Log**: `order_placed` event logged

**Notification**: Supplier receives "New Order Received" notification

---

## 4. Supplier Confirmation

### Flow:
```
Supplier receives notification
    ↓
Supplier Dashboard → Manage Orders
    ↓
View Pending Orders
    ↓
Confirm/Reject Order
```

### Order Status: `confirmed`

**Database Update**:
- `status` → `confirmed`
- `updated_at` → current timestamp

**Audit Log**: `order_confirmed` event logged

**Notification**: Customer receives order confirmation notification

---

## 5. Order Dispatch

### Flow:
```
Supplier prepares delivery
    ↓
Assign Driver & Vehicle
    ↓
Update Vehicle Details
    ↓
Change Status to "Out for Delivery"
```

### Order Status: `out_for_delivery`

**Database Update**:
- `status` → `out_for_delivery`
- Driver phone and vehicle number added to supplier record

**Real-time Updates**: Customer sees live tracking with:
- Driver phone number
- Vehicle number
- Estimated arrival time
- Progress bar (25% → 75%)

**Audit Log**: `order_dispatched` event logged

**Notification**: Customer receives "Your order is on the way" notification

---

## 6. Real-time Order Tracking

### Customer Experience:
```
Customer Dashboard → Track Order
    ↓
View Active Orders (Real-time)
    ↓
View All Orders (Paginated, 5 per page)
```

### Display:
- **Status Timeline**: Shows progression through statuses
  - Order Placed
  - Confirmed
  - On the Way
  - Delivered
  
- **Driver Information**: 
  - Driver phone (clickable for calling)
  - Vehicle number
  - Tanker capacity

- **Location Information**:
  - Delivery address
  - ETA
  - Distance estimation

### Real-time Features:
- Automatic refresh every 10 seconds
- Supabase Realtime subscriptions for instant updates
- Progress bar animation

---

## 7. Order Delivery with OTP Verification

### Flow:
```
Driver arrives at customer location
    ↓
Supplier/Driver initiates delivery
    ↓
System generates 6-digit OTP
    ↓
OTP printed in terminal (console)
    ↓
OTP provided to customer
    ↓
Customer enters OTP
    ↓
OTP verified
    ↓
Order marked as delivered
```

### OTP Generation:
- **OTP**: 6-digit random code (000000-999999)
- **Validity**: 30 minutes from generation
- **Console Output**: 
  ```
  📦 ORDER OTP GENERATED:
  Order ID: [order-id]
  OTP: [otp-code]
  ```

### OTP Verification:
```
Database:
{
  otp_code: "123456"
  otp_generated_at: "2026-05-13T10:30:00Z"
  otp_verified: FALSE
  otp_verified_at: NULL
}

After verification:
{
  status: "delivered"
  otp_verified: TRUE
  otp_verified_at: "2026-05-13T10:35:00Z"
}
```

### Order Status: `delivered`

**Audit Log**: 
- `otp_generated` event logged
- `otp_verified` event logged
- `order_delivered` event logged

**Notification**: Customer receives "Order Delivered" notification

---

## 8. Order History & Tracking

### Customer Features:
- **Active Orders Tab**: Shows "placed", "confirmed", "out_for_delivery" orders
- **All Orders Tab**: Shows complete order history with pagination
  - Displays 5 orders per page
  - Sortable by date
  - Filterable by status
  - Shows delivered and cancelled orders

### Display Information:
- Order ID (first 8 characters)
- Supplier name
- Order date and time
- Quantity
- Total amount
- Current status
- Delivery address

---

## 9. Admin Dashboard - Order Management

### Features:
- **View All Orders**: Pagination (10 items per page)
- **Filter by Status**: All, Pending, Confirmed, Dispatched, Delivered, Cancelled
- **Search**: By order ID or supplier name
- **Order Details**: Customer info, delivery address, amount

### Display:
```
Admin Dashboard → All Orders
    ↓
Filter by status / Search
    ↓
Paginated list (10 per page)
    ↓
View order details
```

---

## 10. Audit Logs - Complete Activity History

### Features:
- **All Events Logged**: Every action tracked in `audit_logs` table
- **Pagination**: 15 logs per page
- **Filterable**: By action type
- **Searchable**: By action, entity type, or order ID

### Event Types:
- `order_placed`: Customer placed an order
- `order_confirmed`: Supplier confirmed order
- `order_dispatched`: Order sent for delivery
- `order_delivered`: Order delivered
- `otp_generated`: OTP code generated for delivery
- `otp_verified`: OTP successfully verified
- `user_registered`: New user registered
- `user_login`: User login event

### Audit Log Schema:
```
{
  id: UUID
  user_id: UUID (nullable)
  action: TEXT ('order_placed', 'otp_verified', etc.)
  entity_type: TEXT ('order', 'user', etc.)
  entity_id: UUID (order ID, user ID, etc.)
  details: JSONB (additional info)
  ip_address: TEXT (nullable)
  created_at: TIMESTAMP
}
```

---

## 11. Error Handling & Special Cases

### Invalid OTP:
```
Customer enters wrong OTP
    ↓
System rejects verification
    ↓
Error message displayed
    ↓
Customer can retry
    ↓
After 3 failed attempts, OTP expires
```

### Expired OTP:
```
OTP valid for 30 minutes
    ↓
If not verified within 30 min
    ↓
OTP becomes invalid
    ↓
New OTP must be generated
```

### Order Cancellation:
- Only allowed in `placed` or `confirmed` status
- Status changes to `cancelled`
- Audit log: `order_cancelled` event

---

## 12. Complete Order Lifecycle Timeline

```
T=0:00    Registration & Profile Setup
          ↓
T=0:05    Browse Products (Pincode-based)
          ↓
T=0:10    Add to Cart & Place Order
          Status: PLACED
          Audit: order_placed ✓
          ↓
T=0:15    Supplier Notification
          ↓
T=0:30    Supplier Confirms Order
          Status: CONFIRMED
          Audit: order_confirmed ✓
          ↓
T=0:45    Supplier Prepares & Assigns Driver
          ↓
T=1:00    Driver Departs
          Status: OUT_FOR_DELIVERY
          Audit: order_dispatched ✓
          Customer sees real-time tracking
          ↓
T=1:15    Driver Arrives
          ↓
T=1:20    Supplier Initiates Delivery
          OTP Generated: 123456
          Audit: otp_generated ✓
          (OTP printed in console)
          ↓
T=1:22    Customer Provides OTP Confirmation
          ↓
T=1:23    System Verifies OTP
          ✓ Match!
          Status: DELIVERED
          Audit: otp_verified ✓
          Customer Notification Sent
          ↓
T=1:25    Order Complete
          Complete Delivery Duration: ~1h 25min
```

---

## 13. Key Database Tables

### orders
```sql
- id (UUID, PK)
- customer_id (UUID, FK)
- supplier_id (UUID, FK)
- quantity (INT)
- total_amount (NUMERIC)
- status (ENUM: placed, confirmed, out_for_delivery, delivered, cancelled)
- delivery_address (TEXT)
- delivery_time (TIMESTAMP)
- otp_code (VARCHAR(6))
- otp_generated_at (TIMESTAMP)
- otp_verified (BOOLEAN)
- otp_verified_at (TIMESTAMP)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)
```

### audit_logs
```sql
- id (UUID, PK)
- user_id (UUID, FK, nullable)
- action (TEXT)
- entity_type (TEXT)
- entity_id (UUID)
- details (JSONB)
- ip_address (TEXT, nullable)
- created_at (TIMESTAMP)
```

---

## 14. API Endpoints & Utilities

### OTP Functions
```typescript
generateOrderOTP(orderId: string): Promise<string>
// Generates OTP, saves to DB, prints to console

verifyDeliveryOTP(orderId: string, enteredOtp: string): Promise<boolean>
// Verifies OTP, updates order status, logs audit event

logAuditEvent(userId, action, entityType, entityId, details)
// Records audit log entry
```

---

## 15. User Experience Flow Diagram

```
CUSTOMER JOURNEY
┌─────────────────────────────────────────────────────────────┐
│ Registration → Browse → Add to Cart → Place Order          │
│                                                              │
│ Track Real-time → View Driver Info → Receive OTP → Done    │
│                                                              │
│ Tabs: "Active Orders" | "All Orders"                       │
│ Features: Pagination (5 items/page), Real-time updates    │
└─────────────────────────────────────────────────────────────┘

SUPPLIER JOURNEY
┌─────────────────────────────────────────────────────────────┐
│ Receive Notification → Accept Order → Prepare Delivery     │
│                                                              │
│ Assign Driver → Generate OTP → Verify & Mark Delivered     │
│                                                              │
│ Dashboard: "Manage Orders" with bulk actions               │
│ Features: Filter by status, bulk confirm orders            │
└─────────────────────────────────────────────────────────────┘

ADMIN JOURNEY
┌─────────────────────────────────────────────────────────────┐
│ View All Orders (Paginated) → Filter/Search → Monitor     │
│                                                              │
│ View Audit Logs (Paginated) → Search Activity             │
│                                                              │
│ Dashboard: All Orders (10 items/page)                      │
│ Features: Filter by status, search by ID/supplier          │
└─────────────────────────────────────────────────────────────┘
```

---

## 16. Key Features Summary

✅ **Product Display**: 1 per supplier per category with real images
✅ **Pagination**: 
   - Admin Orders: 10 per page
   - Customer Track Orders (All): 5 per page
   - Audit Logs: 15 per page
✅ **OTP Verification**: 
   - 6-digit code generated and printed in console
   - Valid for 30 minutes
   - Delivery marked complete only after verification
✅ **Real-time Updates**: Customer sees live order tracking
✅ **Audit Logging**: All activities tracked in audit_logs table
✅ **Notifications**: Customers and suppliers notified at each stage

---

## 17. Implementation Notes

### Console Output for OTP
When supplier initiates delivery, terminal output shows:
```
📦 ORDER OTP GENERATED:
Order ID: 550e8400-e29b-41d4-a716-446655440000
OTP: 123456
```

### Pagination Logic
All paginated pages reset to page 1 when filter/search changes to maintain UX consistency.

### Real-time Subscriptions
Orders are updated every 10 seconds via Supabase Realtime and React Query polling.

---

**Last Updated**: May 13, 2026
**Version**: 1.0
**Status**: Production Ready
