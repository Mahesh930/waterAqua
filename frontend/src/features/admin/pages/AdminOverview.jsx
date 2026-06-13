import React from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp, Star, Package, ChevronRight, Shield, Clock } from "lucide-react";
import { Button } from "@/ui/button";
import { useGetAdminOverviewQuery } from "@/store/api";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminOverview() {
  const { user } = useAuth();

  // RTK Queries
  const { data: overviewData = {}, isLoading } = useGetAdminOverviewQuery();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Generating administrative overview...</p>
      </div>
    );
  }

  const totalRevenue = overviewData.totalRevenue || 0;
  const totalCommission = overviewData.totalCommissions || 0;
  const ordersToday = overviewData.ordersToday || 0;
  const pendingOrders = overviewData.pendingOrders || 0;
  const activeSuppliers = overviewData.activeSuppliers || 0;

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: overviewData.totalOrders || 0, gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
    { icon: IndianRupee, label: "Platform Revenue", value: `₹${totalRevenue > 1000 ? (totalRevenue / 1000).toFixed(1) + "K" : totalRevenue.toLocaleString()}`, gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
    { icon: TrendingUp, label: "Commission Earned", value: `₹${totalCommission > 1000 ? (totalCommission / 1000).toFixed(1) + "K" : Math.round(totalCommission).toLocaleString()}`, gradient: "from-amber-500/10 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
    { icon: Users, label: "Users", value: overviewData.totalUsers || 0, gradient: "from-violet-500/10 via-violet-400/5 to-transparent", iconBg: "bg-violet-500/10", iconColor: "text-violet-400" },
    { icon: Truck, label: "Active Suppliers", value: activeSuppliers, gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
    { icon: Clock, label: "Pending Orders", value: pendingOrders, gradient: "from-rose-500/10 via-rose-500/5 to-transparent", iconBg: "bg-rose-500/10", iconColor: "text-rose-400" },
  ];

  const quickActions = [
    { icon: Package, label: "All Orders", desc: "Monitor & manage", path: "/admin/orders", color: "from-blue-600 to-indigo-600", ring: "ring-blue-500/10" },
    { icon: IndianRupee, label: "Commission", desc: "Track earnings", path: "/admin/commission", color: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/10" },
    { icon: Users, label: "Users", desc: "Manage accounts", path: "/admin/users", color: "from-violet-500 to-purple-600", ring: "ring-violet-500/10" },
    { icon: TrendingUp, label: "Analytics", desc: "Detailed insights", path: "/admin/analytics", color: "from-amber-500 to-orange-600", ring: "ring-amber-500/10" },
  ];

  // Chart data
  const currentYear = new Date().getFullYear();
  const monthlyData = overviewData.monthlyData || [];
  const dailyData = overviewData.dailyData || [];
  const topSuppliers = overviewData.topSuppliers || [];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8 text-slate-200">
      {/* Hero Banner */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-600 p-6 sm:p-8 text-white shadow-xl">
        <div className="absolute inset-0 opacity-15">
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <span className="text-xs font-semibold bg-white/10 backdrop-blur px-2.5 py-1 rounded-full text-white border border-white/10">
              Admin Dashboard
            </span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold mt-4">
            Welcome, Administrator! 🎛️
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1.5 max-w-md">
            {ordersToday} orders today · ₹{Math.round(totalCommission).toLocaleString()} commission earned
          </p>
          <div className="flex gap-3 mt-6">
            <Link to="/admin/orders">
              <Button size="lg" className="rounded-xl bg-white text-blue-600 hover:bg-slate-100 shadow-md gap-2 font-bold border border-white">
                <Package className="h-4 w-4" /> View Orders
              </Button>
            </Link>
            <Link to="/admin/commission">
              <Button size="lg" variant="ghost" className="rounded-xl border border-white/20 text-white hover:bg-white/10 hover:text-white gap-2 font-bold bg-white/5 shadow-md">
                Commission Report
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <Link key={action.path} to={action.path}>
              <motion.div whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className={`bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 cursor-pointer group hover:shadow-xl hover:border-blue-500/10 transition-all duration-300 ring-1 ${action.ring} ring-inset shadow-md`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-md`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-bold text-white text-sm">{action.label}</p>
                <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{action.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item}>
        <h3 className="font-bold text-white text-lg mb-3.5">Platform Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 bg-gradient-to-br ${s.gradient} shadow-md`}>
              <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2.5`}>
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-bold text-white">{s.value}</p>
              <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Revenue & Commission ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="comGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fill="url(#revGradAdmin)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="commission" stroke="#f59e0b" fill="url(#comGradAdmin)" strokeWidth={2} name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Daily Orders (14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} />
              <Bar dataKey="orders" fill="#818cf8" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Suppliers */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-white">Top-Rated Suppliers</h3>
          <Link to="/admin/suppliers" className="text-xs text-blue-400 font-bold flex items-center gap-1 hover:underline">
            View All <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        {topSuppliers.length === 0 ? (
          <p className="text-slate-500 text-center py-6">No suppliers yet.</p>
        ) : (
          <div className="space-y-2">
            {topSuppliers.map((s, i) => (
              <div key={s.id || s._id} className="bg-[#090d22]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-blue-600/10 flex items-center justify-center font-bold text-sm text-blue-400 border border-blue-500/10">#{i + 1}</span>
                  <div>
                    <p className="font-bold text-white text-sm">{s.businessName || s.business_name}</p>
                    <p className="text-xs text-slate-500 font-semibold">{s.area}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 bg-[#0e142e] border border-white/5 px-2 py-0.5 rounded-lg">
                  <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                  <span className="font-bold text-sm text-white">{Number(s.rating || 0).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
