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
const CustomerDashboard = React.lazy(() => import("@/features/customer/pages/CustomerDashboard"));
const SupplierDashboard = React.lazy(() => import("@/features/supplier/pages/SupplierDashboard"));
const AdminDashboard = React.lazy(() => import("@/features/admin/pages/AdminDashboard"));
const ContactUs = React.lazy(() => import("./pages/ContactUs"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

const LoadingFallback = () => (
  <div className="min-h-screen flex flex-col items-center justify-center bg-[#060818] space-y-4">
    <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin"></div>
    <p className="text-white/60 text-sm font-medium animate-pulse">Loading dashboard session...</p>
  </div>
);

const App = () => (
  <TooltipProvider>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <React.Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/contact" element={<ContactUs />} />
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
        </React.Suspense>
      </AuthProvider>
    </BrowserRouter>
  </TooltipProvider>
);

export default App;
