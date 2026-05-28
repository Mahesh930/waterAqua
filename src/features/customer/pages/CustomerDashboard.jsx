import React from "react";
import { Home, Search, ShoppingBag, Clock, Navigation, User, ShoppingCart, Package } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import CustomerHome from "./CustomerHome";
import BrowseSuppliers from "./BrowseSuppliers";
import Cart from "./Cart";
import TrackOrder from "./TrackOrder";
import OrderHistory from "./OrderHistory";
import CustomerProfile from "./CustomerProfile";
import ProductCatalog from "./ProductCatalog";
import ChatBot from "@/features/customer/components/ChatBot";

const navItems = [
  { label: "Home", path: "/customer", icon: <Home className="h-4 w-4" /> },
  { label: "Products", path: "/customer/products", icon: <Package className="h-4 w-4" /> },
  { label: "Suppliers", path: "/customer/suppliers", icon: <Search className="h-4 w-4" /> },
  { label: "Cart", path: "/customer/cart", icon: <ShoppingCart className="h-4 w-4" /> },
  { label: "Track", path: "/customer/track", icon: <Navigation className="h-4 w-4" /> },
  { label: "Profile", path: "/customer/profile", icon: <User className="h-4 w-4" /> },
];

export default function CustomerDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="AquaHome">
      <Routes>
        <Route index element={<CustomerHome />} />
        <Route path="products" element={<ProductCatalog />} />
        <Route path="suppliers" element={<BrowseSuppliers />} />
        <Route path="cart" element={<Cart />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="history" element={<OrderHistory />} />
        <Route path="profile" element={<CustomerProfile />} />
      </Routes>
      <ChatBot />
    </DashboardLayout>
  );
}
