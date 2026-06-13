import React, { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery, useGetMySupplierQuery, useGetSupplierFeedbackQuery } from "@/store/api";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, Package, Star, IndianRupee, Calendar, Droplets } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SupplierReports() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  // RTK Queries
  const { data: supplier } = useGetMySupplierQuery();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: feedbacks = [] } = useGetSupplierFeedbackQuery(supplier?.id || supplier?._id, {
    skip: !supplier
  });

  if (ordersLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Generating business reports...</p>
      </div>
    );
  }

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  
  // Filter supplier-only orders by year
  const yearOrders = orders.filter(o => {
    const oDate = o.createdAt || o.created_at;
    return oDate && new Date(oDate).getFullYear().toString() === year;
  });

  const monthlyData = monthNames.map((name, idx) => {
    const monthOrders = yearOrders.filter(o => {
      const oDate = o.createdAt || o.created_at;
      return oDate && new Date(oDate).getMonth() === idx;
    });
    return {
      month: name,
      orders: monthOrders.length,
      revenue: monthOrders
        .filter(o => o.status === "delivered")
        .reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0),
    };
  });

  const statusCounts = [
    { name: "Delivered", value: yearOrders.filter(o => o.status === "delivered").length, color: "#10b981" },
    { name: "Active", value: yearOrders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "#3b82f6" },
    { name: "Cancelled", value: yearOrders.filter(o => o.status === "cancelled").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  const avgRating = feedbacks.length 
    ? (feedbacks.reduce((sum, f) => sum + Number(f.rating || 0), 0) / feedbacks.length).toFixed(1) 
    : "N/A";
  const totalRevenue = yearOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);
  const totalCans = yearOrders
    .filter(o => o.status === "delivered")
    .reduce((sum, o) => {
      // Sum the quantities in product list
      const qtySum = o.products ? o.products.reduce((acc, p) => acc + Number(p.quantity || 0), 0) : 0;
      return sum + qtySum;
    }, 0);

  // Extract years dynamically
  const years = [...new Set(orders.map(o => {
    const oDate = o.createdAt || o.created_at;
    return oDate ? new Date(oDate).getFullYear().toString() : year;
  }))];
  if (!years.includes(year)) years.push(year);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Business Reports</h2>
          <p className="text-slate-400 text-sm mt-0.5">Analyze your performance and revenue trends</p>
        </div>
        <div className="flex gap-1.5">
          {years.sort().map(y => (
            <button 
              key={y} 
              onClick={() => setYear(y)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                year === y 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {y}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: "Total Orders", value: yearOrders.length, gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
          { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue.toLocaleString()}`, gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
          { icon: Star, label: "Avg Rating", value: avgRating, gradient: "from-amber-500/10 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
          { icon: Droplets, label: "Cans Sold", value: totalCans, gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
        ].map(s => (
          <div key={s.label} className={`bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-lg`}>
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2.5`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Order Distribution</h3>
          {statusCounts.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-[240px] sm:h-auto">
              <ResponsiveContainer width="100%" height={180} className="max-w-[180px]">
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={45}>
                    {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 shrink-0">
                {statusCounts.map(s => (
                  <div key={s.name} className="flex items-center gap-3">
                    <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm text-slate-400 font-semibold">{s.name}</span>
                    <span className="font-bold text-sm text-white ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No data for {year}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly breakdown */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
        <h3 className="font-bold text-white mb-4">Monthly Orders</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
            <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
            <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
            <Bar dataKey="orders" fill="#818cf8" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
