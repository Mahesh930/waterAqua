import { Home, Search, ShoppingBag, Clock, Star } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Routes, Route, Navigate } from "react-router-dom";
import CustomerHome from "./CustomerHome";
import BrowseSuppliers from "./BrowseSuppliers";
import PlaceOrder from "./PlaceOrder";
import OrderHistory from "./OrderHistory";

const navItems = [
  { label: "Home", path: "/customer", icon: <Home className="h-4 w-4" /> },
  { label: "Browse Suppliers", path: "/customer/suppliers", icon: <Search className="h-4 w-4" /> },
  { label: "Place Order", path: "/customer/order", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Order History", path: "/customer/history", icon: <Clock className="h-4 w-4" /> },
];

export default function CustomerDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="AquaHome">
      <Routes>
        <Route index element={<CustomerHome />} />
        <Route path="suppliers" element={<BrowseSuppliers />} />
        <Route path="order" element={<PlaceOrder />} />
        <Route path="history" element={<OrderHistory />} />
      </Routes>
    </DashboardLayout>
  );
}
