import { LayoutDashboard, Users, Package, Settings } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminOrders from "./AdminOrders";

const navItems = [
  { label: "Overview", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Users & Suppliers", path: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Orders", path: "/admin/orders", icon: <Package className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="orders" element={<AdminOrders />} />
      </Routes>
    </DashboardLayout>
  );
}
