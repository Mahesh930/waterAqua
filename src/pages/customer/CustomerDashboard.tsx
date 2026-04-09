import { Home, Search, ShoppingBag, Clock, Navigation } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import CustomerHome from "./CustomerHome";
import BrowseSuppliers from "./BrowseSuppliers";
import PlaceOrder from "./PlaceOrder";
import OrderHistory from "./OrderHistory";
import TrackOrder from "./TrackOrder";

const navItems = [
  { label: "Home", path: "/customer", icon: <Home className="h-4 w-4" /> },
  { label: "Suppliers", path: "/customer/suppliers", icon: <Search className="h-4 w-4" /> },
  { label: "Book", path: "/customer/order", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Track", path: "/customer/track", icon: <Navigation className="h-4 w-4" /> },
  { label: "History", path: "/customer/history", icon: <Clock className="h-4 w-4" /> },
];

export default function CustomerDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="AquaHome">
      <Routes>
        <Route index element={<CustomerHome />} />
        <Route path="suppliers" element={<BrowseSuppliers />} />
        <Route path="order" element={<PlaceOrder />} />
        <Route path="track" element={<TrackOrder />} />
        <Route path="history" element={<OrderHistory />} />
      </Routes>
    </DashboardLayout>
  );
}
