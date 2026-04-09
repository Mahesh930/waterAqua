import { Package, ClipboardList, User } from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import SupplierHome from "./SupplierHome";
import ManageOrders from "./ManageOrders";
import SupplierProfile from "./SupplierProfile";

const navItems = [
  { label: "Dashboard", path: "/supplier", icon: <Package className="h-4 w-4" /> },
  { label: "Orders", path: "/supplier/orders", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Profile", path: "/supplier/profile", icon: <User className="h-4 w-4" /> },
];

export default function SupplierDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Supplier Panel">
      <Routes>
        <Route index element={<SupplierHome />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="profile" element={<SupplierProfile />} />
      </Routes>
    </DashboardLayout>
  );
}
