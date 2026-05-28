import React from "react";
import { useGetOrdersQuery, useGetAdminSuppliersQuery } from "@/store/api";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star, TrendingUp, Package, IndianRupee, Users, Calendar, Droplets } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminAnalytics() {
  // RTK Queries
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const { data: suppliers = [], isLoading: suppliersLoading } = useGetAdminSuppliersQuery();

  const isLoading = ordersLoading || suppliersLoading;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Analyzing platform data logs...</p>
      </div>
    );
  }

  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const ordersPerMonth = monthNames.map((name, idx) => {
    const count = orders.filter(o => {
      const oDate = o.createdAt || o.created_at;
      const d = new Date(oDate);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;

    const revenue = orders.filter(o => {
      const oDate = o.createdAt || o.created_at;
      const d = new Date(oDate);
      return d.getFullYear() === currentYear && d.getMonth() === idx && o.status === "delivered";
    }).reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);

    return { month: name, orders: count, revenue };
  });

  const statusData = [
    { name: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "#10b981" },
    { name: "Active", value: orders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "#3b82f6" },
    { name: "Cancelled", value: orders.filter(o => o.status === "cancelled").length, color: "#ef4444" },
  ].filter(s => s.value > 0);

  // Generate top rating distribution from suppliers aggregate scores
  const ratingDist = [1, 2, 3, 4, 5].map(r => {
    const count = suppliers.filter(s => Math.round(s.rating || 0) === r).length;
    return { rating: `${r}★`, count };
  });

  const supplierRevenue = suppliers.map(s => {
    const sName = s.businessName || s.business_name || "Unknown Brand";
    const name = sName.length > 12 ? sName.slice(0, 12) + "…" : sName;
    const revenue = orders.filter(o => {
      const oSuppId = o.supplier?._id || o.supplier?.id || o.supplier;
      const sUserId = s.user?._id || s.user?.id || s.user;
      return oSuppId === sUserId && o.status === "delivered";
    }).reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);

    return { name, revenue };
  }).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const avgRating = suppliers.length 
    ? (suppliers.reduce((sum, s) => sum + Number(s.rating || 0), 0) / suppliers.length).toFixed(1) 
    : "N/A";

  const satisfactionPct = suppliers.length 
    ? Math.round((suppliers.filter(s => Number(s.rating || 0) >= 4).length / suppliers.length) * 100) 
    : 0;

  const totalReviews = suppliers.reduce((sum, s) => sum + Number(s.reviewCount || 0), 0);

  const totalCansDelivered = orders.filter(o => o.status === "delivered").reduce((sum, o) => {
    const qtySum = o.products ? o.products.reduce((acc, p) => acc + Number(p.quantity || 0), 0) : Number(o.quantity || 0);
    return sum + qtySum;
  }, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Platform Analytics</h2>
        <p className="text-slate-400 text-sm mt-0.5">Detailed insights across all operations</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Star, label: "Avg Rating", value: `${avgRating}/5`, gradient: "from-amber-500/10 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
          { icon: TrendingUp, label: "Satisfaction", value: `${satisfactionPct}%`, gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
          { icon: Users, label: "Total Reviews", value: totalReviews, gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
          { icon: Droplets, label: "Cans Delivered", value: totalCansDelivered, gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
        ].map(s => (
          <div key={s.label} className={`bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-md`}>
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2.5`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-bold text-white">{s.value}</p>
            <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Revenue Trend ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ordersPerMonth}>
              <defs>
                <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} formatter={(v) => [`₹${v}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#analyticsRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Order Status</h3>
          {statusData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-[220px] sm:h-auto">
              <ResponsiveContainer width="100%" height={180} className="max-w-[180px]">
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3 shrink-0">
                {statusData.map(s => (
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
              <Package className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No data</p>
            </div>
          )}
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Suppliers Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="rating" tick={{ fontSize: 12, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              <Bar dataKey="count" fill="#f59e0b" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Top Suppliers by Revenue</h3>
          {supplierRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={supplierRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis type="number" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" width={90} />
                <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} formatter={(v) => [`₹${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="#818cf8" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <p className="text-sm">No data</p>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
