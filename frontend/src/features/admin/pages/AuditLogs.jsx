import React, { useState } from "react";
import { useGetAdminLogsQuery } from "@/store/api";
import { motion } from "framer-motion";
import { Search, ChevronLeft, ChevronRight, Eye, Clock, Shield } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const actionColors = {
  "user_registered": "bg-blue-500/10 text-blue-400 border-blue-500/10",
  "user_logged_in": "bg-sky-500/10 text-sky-400 border-sky-500/10",
  "user_profile_updated": "bg-violet-500/10 text-violet-400 border-violet-500/10",
  "password_reset_requested": "bg-rose-500/10 text-rose-400 border-rose-500/10",
  "password_reset_completed": "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  "user_suspended": "bg-red-500/10 text-red-400 border-red-500/10",
  "user_activated": "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  "supplier_profile_updated": "bg-purple-500/10 text-purple-400 border-purple-500/10",
  "product_created": "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  "product_updated": "bg-violet-500/10 text-violet-400 border-violet-500/10",
  "product_deleted": "bg-rose-500/10 text-rose-400 border-rose-500/10",
  "order_placed": "bg-blue-500/10 text-blue-400 border-blue-500/10",
  "order_status_updated": "bg-indigo-500/10 text-indigo-400 border-indigo-500/10",
  "order_otp_verified": "bg-teal-500/10 text-teal-400 border-teal-500/10",
  "order_cancelled_by_customer": "bg-rose-500/10 text-rose-400 border-rose-500/10",
  "feedback_submitted": "bg-amber-500/10 text-amber-400 border-amber-500/10"
};

const getLogMessage = (log) => {
  const userName = log.user?.name || "System";
  const userRole = log.user?.role || "";
  const roleStr = userRole ? ` (${userRole})` : "";
  
  switch (log.action) {
    case "user_registered":
      return `New user "${userName}"${roleStr} registered with email ${log.details?.email || ""}.`;
    case "user_logged_in":
      return `User "${userName}"${roleStr} logged in successfully.`;
    case "user_profile_updated":
      return `User "${userName}"${roleStr} updated profile fields: ${log.details?.updatedFields?.join(", ") || "N/A"}.`;
    case "password_reset_requested":
      return `Password reset requested for email ${log.details?.email || ""}.`;
    case "password_reset_completed":
      return `Password reset completed for user "${userName}".`;
    case "user_suspended":
      return `Admin suspended user account "${log.details?.targetUserName || "User"}" (${log.details?.targetUserId || ""}).`;
    case "user_activated":
      return `Admin activated user account "${log.details?.targetUserName || "User"}" (${log.details?.targetUserId || ""}).`;
    case "supplier_profile_updated":
      return `Supplier "${userName}" updated business profile fields: ${log.details?.updatedFields?.join(", ") || "N/A"}.`;
    case "product_created":
      return `Supplier "${userName}" added product "${log.details?.name || "Product"}" to catalog for ₹${log.details?.price || 0}.`;
    case "product_updated":
      return `Supplier "${userName}" updated product "${log.details?.name || "Product"}" fields: ${log.details?.updatedFields?.join(", ") || "N/A"}.`;
    case "product_deleted":
      return `Supplier "${userName}" soft-deleted product "${log.details?.name || "Product"}" from catalog.`;
    case "order_placed":
      return `Customer "${userName}" placed order #${log.entityId?.toString().slice(-8).toUpperCase()} (₹${log.details?.totalAmount || 0}) with supplier ${log.details?.supplierId || ""}.`;
    case "order_status_updated":
      return `Order #${log.entityId?.toString().slice(-8).toUpperCase()} status updated to "${log.details?.status || ""}" by "${userName}".`;
    case "order_otp_verified":
      return `Order #${log.entityId?.toString().slice(-8).toUpperCase()} delivered and OTP verified. Payment: ${log.details?.paymentMethod?.toUpperCase() || "COD"}.`;
    case "order_cancelled_by_customer":
      return `Order #${log.entityId?.toString().slice(-8).toUpperCase()} was cancelled by customer "${userName}".`;
    case "feedback_submitted":
      return `Customer "${userName}" submitted rating ${log.details?.rating || 0}★ feedback for order #${log.entityId?.toString().slice(-8).toUpperCase()}.`;
    default:
      return log.details?.message || `Performed action "${log.action}" on entity ${log.entityType}.`;
  }
};

export default function AdminAuditLogs() {
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [filterAction, setFilterAction] = useState("all");
  const itemsPerPage = 15;

  // RTK Query to get 100 recent audit logs from DB
  const { data: logs = [], isLoading } = useGetAdminLogsQuery({ limit: 100 });

  const accountActions = [
    "user_registered", "user_logged_in", "user_profile_updated",
    "password_reset_requested", "password_reset_completed",
    "user_suspended", "user_activated", "supplier_profile_updated"
  ];
  
  const orderActions = [
    "order_placed", "order_status_updated", "order_otp_verified",
    "order_cancelled_by_customer"
  ];

  const productActions = [
    "product_created", "product_updated", "product_deleted"
  ];

  // Filter logs based on tabs and search term
  const filtered = logs
    .filter(l => {
      if (filterAction === "all") return true;
      if (filterAction === "accounts") return accountActions.includes(l.action);
      if (filterAction === "orders") return orderActions.includes(l.action);
      if (filterAction === "products") return productActions.includes(l.action);
      return true;
    })
    .filter(l => {
      const term = search.toLowerCase();
      const matchAction = l.action.toLowerCase().includes(term);
      const matchId = l.entityId?.toString().includes(search);
      const matchType = l.entityType.toLowerCase().includes(term);
      const matchMsg = getLogMessage(l).toLowerCase().includes(term);
      const matchUser = l.user?.name?.toLowerCase().includes(term);
      return !search || matchAction || matchId || matchType || matchMsg || matchUser;
    });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedLogs = filtered.slice(startIdx, endIdx);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  const actionCounts = {
    "all": logs.length,
    "accounts": logs.filter(l => accountActions.includes(l.action)).length,
    "orders": logs.filter(l => orderActions.includes(l.action)).length,
    "products": logs.filter(l => productActions.includes(l.action)).length,
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Audit Logs</h2>
          <p className="text-slate-400 text-sm mt-0.5">Complete database activity history and system events</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search logs by keyword, user, action or ID..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl h-11 bg-[#0e142e]/60 border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
        />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {[
          { key: "all", label: "All Events" },
          { key: "accounts", label: "Accounts" },
          { key: "orders", label: "Orders" },
          { key: "products", label: "Products" },
        ].map(tab => (
          <button 
            key={tab.key} 
            onClick={() => { setFilterAction(tab.key); setCurrentPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterAction === tab.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filterAction === tab.key ? "bg-white/20 text-white" : "bg-[#090d22] text-slate-400 border border-white/5"}`}>
              {actionCounts[tab.key] || 0}
            </span>
          </button>
        ))}
      </motion.div>

      {/* Logs */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-400 font-semibold">Loading audit logs...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/30 border border-white/5 rounded-3xl shadow-lg">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Eye className="h-8 w-8 text-slate-500" />
          </div>
          <p className="font-bold text-lg text-white">No audit logs found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Showing {startIdx + 1}-{Math.min(endIdx, filtered.length)} of {filtered.length} logs
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-semibold px-2 text-slate-400">
                Page {currentPage} of {Math.max(1, totalPages)}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {paginatedLogs.map(log => (
              <motion.div 
                key={log._id || log.id} 
                variants={item}
                className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 hover:shadow-lg transition-shadow shadow-md"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 flex-wrap mb-2">
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border ${
                        actionColors[log.action] || "bg-slate-500/10 text-slate-400 border-slate-500/10"
                      }`}>
                        {log.action.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </span>
                      <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-md border border-white/5 font-bold uppercase tracking-wider">
                        {log.entityType}
                      </span>
                      {log.entityId && (
                        <span className="text-xs text-slate-500 font-semibold truncate">
                          #{log.entityId.toString().slice(-8).toUpperCase()}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-sm text-slate-300 font-semibold mb-2">
                      {getLogMessage(log)}
                    </div>
                    
                    <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-slate-600" />
                        {new Date(log.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit"
                        })}
                      </span>
                      {log.ipAddress && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span>IP: {log.ipAddress}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
