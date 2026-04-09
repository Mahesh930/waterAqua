
## Remaining PRD Features to Implement

### Already Built ✅
- Register/Login (Customer & Supplier)
- Browse suppliers with location filter
- Place orders, view order history
- Supplier profile management, inventory/stock
- Accept/reject/dispatch/deliver orders
- Feedback & rating system
- Admin overview, users list, all orders view

### Missing Features to Add 🔧

#### 1. Customer: Cancel/Modify Order (before dispatch)
- Add "Cancel Order" button on orders with status `placed` or `confirmed`
- Update order status to `cancelled`

#### 2. Customer: Real-Time Order Tracking
- Enable Supabase Realtime on orders table
- Show live status updates without page refresh

#### 3. Customer: Download Payment Receipt
- Generate a downloadable receipt (HTML-to-print) for delivered orders

#### 4. Supplier: Payment History Page
- New page showing all delivered orders with revenue breakdown
- Monthly totals

#### 5. Supplier: Monthly Order Reports
- Summary cards: monthly orders, revenue, avg rating
- Filterable by month

#### 6. Admin: Analytics Dashboard with Charts
- Revenue trends (line chart via Recharts)
- Orders per day/month (bar chart)
- Top-rated suppliers list
- Customer satisfaction metrics (avg rating)

#### 7. Admin: User Management Actions
- Block/unblock suppliers
- View supplier verification status

#### 8. In-App Notification System
- Notification bell in nav bar
- Store notifications in a new `notifications` table
- Show order status change alerts

#### 9. Supplier: View Customer Feedback with Names
- Show customer name alongside feedback on supplier profile
