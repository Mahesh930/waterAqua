import React from "react";
import { Package, ClipboardList, User, IndianRupee, FileText, ShoppingBag } from "lucide-react";
import DashboardLayout from "@/shared/components/DashboardLayout";
import { Routes, Route } from "react-router-dom";
import SupplierHome from "./SupplierHome";
import ManageOrders from "./ManageOrders";
import SupplierProfile from "./SupplierProfile";
import PaymentHistory from "./PaymentHistory";
import SupplierReports from "./SupplierReports";
import SupplierProducts from "./SupplierProducts";

const navItems = [
  { label: "Dashboard", path: "/supplier", icon: <Package className="h-4 w-4" /> },
  { label: "Products", path: "/supplier/products", icon: <ShoppingBag className="h-4 w-4" /> },
  { label: "Orders", path: "/supplier/orders", icon: <ClipboardList className="h-4 w-4" /> },
  { label: "Payments", path: "/supplier/payments", icon: <IndianRupee className="h-4 w-4" /> },
  { label: "Reports", path: "/supplier/reports", icon: <FileText className="h-4 w-4" /> },
  { label: "Profile", path: "/supplier/profile", icon: <User className="h-4 w-4" /> },
];

export default function SupplierDashboard() {
  return (
    <DashboardLayout navItems={navItems} title="Supplier Panel">
      <Routes>
        <Route index element={<SupplierHome />} />
        <Route path="products" element={<SupplierProducts />} />
        <Route path="orders" element={<ManageOrders />} />
        <Route path="payments" element={<PaymentHistory />} />
        <Route path="reports" element={<SupplierReports />} />
        <Route path="profile" element={<SupplierProfile />} />
      </Routes>
    </DashboardLayout>
  );
}
