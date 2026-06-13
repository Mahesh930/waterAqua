import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery } from "@/store/api";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Package, Calendar, ChevronRight } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function PaymentHistory() {
  const { user } = useAuth();
  const [monthFilter, setMonthFilter] = useState("all");

  // RTK Query: fetch all orders (automatically filtered for supplier in backend)
  const { data: orders = [], isLoading } = useGetOrdersQuery();

  // Filter only delivered orders for payment history
  const deliveredOrders = orders.filter(o => o.status === "delivered");

  // Extract unique year-months from delivered orders
  const months = [...new Set(deliveredOrders.map(o => {
    const oDate = o.createdAt || o.created_at;
    const d = new Date(oDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))];

  // Filter orders by month selection
  const filtered = monthFilter === "all" ? deliveredOrders : deliveredOrders.filter(o => {
    const oDate = o.createdAt || o.created_at;
    const d = new Date(oDate);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthFilter;
  });

  const totalRevenue = filtered.reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);
  
  const totalCans = filtered.reduce((sum, o) => {
    const qtySum = o.products ? o.products.reduce((acc, p) => acc + Number(p.quantity || 0), 0) : Number(o.quantity || 0);
    return sum + qtySum;
  }, 0);

  const avgOrder = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

  const monthTabs = [
    { key: "all", label: "All Time" }, 
    ...months.sort().reverse().map(m => ({
      key: m, 
      label: new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
    }))
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Payment History</h2>
        <p className="text-slate-400 text-sm mt-0.5">Track your earnings from delivered orders</p>
      </motion.div>

      {/* Month Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin">
        {monthTabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => setMonthFilter(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              monthFilter === t.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {t.label}
          </button>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
          { icon: Package, label: "Orders", value: filtered.length, gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
          { icon: TrendingUp, label: "Avg Order", value: `₹${avgOrder.toLocaleString()}`, gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
        ].map(s => (
          <div key={s.label} className={`bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-md`}>
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2.5`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <p className="text-xl sm:text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Transactions */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-400">Loading payments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/30 border border-white/5 rounded-3xl">
          <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
            <IndianRupee className="h-8 w-8 text-slate-500" />
          </div>
          <p className="font-bold text-lg text-white">No payments yet</p>
          <p className="text-sm text-slate-500 mt-1">Completed orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map((order) => {
            const oDate = order.createdAt || order.created_at;
            const oId = order.id || order._id;
            const quantity = order.products ? order.products.reduce((acc, p) => acc + Number(p.quantity || 0), 0) : Number(order.quantity || 0);
            
            return (
              <motion.div 
                key={oId} 
                variants={item}
                className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3.5 hover:shadow-lg transition-shadow"
              >
                <div className="h-11 w-11 rounded-xl bg-emerald-500/10 flex items-center justify-center shrink-0">
                  <Calendar className="h-5 w-5 text-emerald-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm text-white truncate">Order #{oId.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {quantity} units · {new Date(oDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className="font-bold text-emerald-400 text-lg shrink-0">+₹{Number(order.totalAmount || order.total_amount).toLocaleString()}</span>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}
