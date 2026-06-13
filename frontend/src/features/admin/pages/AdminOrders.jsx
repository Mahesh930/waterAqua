import React, { useState, useEffect } from "react";
import { useGetOrdersQuery, useGetAdminOverviewQuery } from "@/store/api";
import { motion } from "framer-motion";
import { Package, MapPin, Clock, IndianRupee, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const statusColors = {
  placed: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/10",
  out_for_delivery: "bg-indigo-500/10 text-indigo-400 border-indigo-500/10",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/10",
};

const statusLabels = {
  placed: "⏳ Pending",
  confirmed: "✅ Confirmed",
  out_for_delivery: "🚛 Dispatched",
  delivered: "📦 Delivered",
  cancelled: "❌ Cancelled",
};

export default function AdminOrders() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(handler);
  }, [search]);

  // RTK Query: fetch paginated/filtered platform orders
  const { data: responseData = {}, isLoading } = useGetOrdersQuery({
    status: filter !== "all" ? filter : undefined,
    search: debouncedSearch || undefined,
    page,
    limit: 10
  });

  const { data: overviewData = {} } = useGetAdminOverviewQuery();

  const orders = responseData.results || [];
  const pagination = responseData.pagination || { page: 1, pages: 1, total: 0 };
  const orderCounts = overviewData.orderCounts || {
    placed: 0,
    confirmed: 0,
    out_for_delivery: 0,
    delivered: 0,
    cancelled: 0
  };

  const filterTabs = [
    { key: "all", label: "All", count: overviewData.totalOrders || 0 },
    { key: "placed", label: "Pending", count: orderCounts.placed },
    { key: "confirmed", label: "Confirmed", count: orderCounts.confirmed },
    { key: "out_for_delivery", label: "Dispatched", count: orderCounts.out_for_delivery },
    { key: "delivered", label: "Delivered", count: orderCounts.delivered },
    { key: "cancelled", label: "Cancelled", count: orderCounts.cancelled },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">All Orders</h2>
          <p className="text-slate-400 text-sm mt-0.5">{pagination.total} orders matching filters</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search by order ID, customer name or supplier brand..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl h-11 bg-[#0e142e]/60 border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
        />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {filterTabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => { setFilter(t.key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === t.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] font-bold ${filter === t.key ? "bg-white/20 text-white" : "bg-[#090d22] text-slate-400 border border-white/5"}`}>{t.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-400 font-semibold">Filtering orders logs...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/30 border border-white/5 rounded-3xl shadow-lg">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <Package className="h-8 w-8 text-slate-500" />
          </div>
          <p className="font-bold text-lg text-white">No orders found</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
              Showing {((page - 1) * 10) + 1}-{Math.min(page * 10, pagination.total)} of {pagination.total} order{pagination.total !== 1 ? "s" : ""}
            </p>
            <div className="flex items-center gap-1.5">
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                onClick={() => setPage(prev => Math.max(1, prev - 1))}
                disabled={page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <div className="text-xs font-semibold px-2 text-slate-400">
                Page {page} of {pagination.pages}
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                disabled={page >= pagination.pages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2.5">
            {orders.map(order => {
              const oId = order.id || order._id;
              const oDate = order.createdAt || order.created_at;
              const qty = order.products ? order.products.reduce((acc, p) => acc + Number(p.quantity || 0), 0) : Number(order.quantity || 0);
              
              return (
                <motion.div 
                  key={oId} 
                  variants={item}
                  className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 hover:shadow-lg transition-shadow shadow-md"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3.5 min-w-0">
                       <div className="h-11 w-11 rounded-xl bg-blue-600/10 flex items-center justify-center text-lg shrink-0 border border-blue-500/10">📦</div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">#{oId.slice(-8).toUpperCase()}</span>
                          <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${statusColors[order.status]}`}>
                            {statusLabels[order.status]}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 font-semibold mt-1">
                          <span className="text-slate-400">{order.supplier?.name || order.supplier?.businessName || "Unknown Distributor"}</span>
                          <span className="text-slate-700">·</span>
                          <span>{qty} units</span>
                          <span className="text-slate-700">·</span>
                          <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-slate-600" /> {new Date(oDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {order.deliveryAddress && (
                          <p className="text-[10px] text-slate-500 font-semibold mt-1 flex items-center gap-1 leading-none truncate max-w-[280px] sm:max-w-md">
                            <MapPin className="h-3 w-3 shrink-0 text-slate-600" />{order.deliveryAddress}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="font-bold text-blue-400 text-lg shrink-0">₹{Number(order.totalAmount || order.total_amount).toLocaleString()}</span>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </motion.div>
  );
}
