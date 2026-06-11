import React from "react";
import { LayoutDashboard, Users, Package, BarChart3, IndianRupee, Truck, Clock } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import AdminOverview from "./AdminOverview";
import AdminUsers from "./AdminUsers";
import AdminOrders from "./AdminOrders";
import AdminAnalytics from "./AdminAnalytics";
import AdminCommissions from "./AdminCommissions";
import AdminSuppliers from "./AdminSuppliers";
import AdminAuditLogs from "./AuditLogs";

const navItems = [
  { label: "Overview", path: "/admin", icon: <LayoutDashboard className="h-4 w-4" /> },
  { label: "Orders", path: "/admin/orders", icon: <Package className="h-4 w-4" /> },
  { label: "Suppliers", path: "/admin/suppliers", icon: <Truck className="h-4 w-4" /> },
  { label: "Commission", path: "/admin/commission", icon: <IndianRupee className="h-4 w-4" /> },
  { label: "Users", path: "/admin/users", icon: <Users className="h-4 w-4" /> },
  { label: "Logs", path: "/admin/logs", icon: <Clock className="h-4 w-4" /> },
  { label: "Analytics", path: "/admin/analytics", icon: <BarChart3 className="h-4 w-4" /> },
];

export default function AdminDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Admin Panel">
      <Routes>
        <Route index element={<AdminOverview />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="suppliers" element={<AdminSuppliers />} />
        <Route path="orders" element={<AdminOrders />} />
        <Route path="analytics" element={<AdminAnalytics />} />
        <Route path="commission" element={<AdminCommissions />} />
        <Route path="logs" element={<AdminAuditLogs />} />
      </Routes>
    </DashboardLayout>
  );
}
