import React from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/ui/sonner";
import { Toaster } from "@/ui/toaster";
import { TooltipProvider } from "@/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/shared/components/ProtectedRoute";
import Index from "./pages/Index";
import Login from "@/features/auth/pages/Login";
import Register from "@/features/auth/pages/Register";
import CustomerDashboard from "@/features/customer/pages/CustomerDashboard";
import SupplierDashboard from "@/features/supplier/pages/SupplierDashboard";
import AdminDashboard from "@/features/admin/pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/customer/*" element={
            <ProtectedRoute allowedRoles={["customer"]}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/supplier/*" element={
            <ProtectedRoute allowedRoles={["supplier"]}>
              <SupplierDashboard />
            </ProtectedRoute>
          } />
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
