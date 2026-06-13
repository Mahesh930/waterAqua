import React, { useState } from "react";
import { useGetAdminCommissionsQuery } from "@/store/api";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Clock, MapPin, Zap, Package, Calendar, Info, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminCommissions() {
  const [period, setPeriod] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // RTK Query: fetch admin commissions list (fetch 1000 items so charts/summaries are calculated correctly)
  const { data: commissionsData = {}, isLoading } = useGetAdminCommissionsQuery({ limit: 1000 });
  const commissions = commissionsData.results || [];

  const now = new Date();
  const filtered = commissions.filter(c => {
    if (period === "all") return true;
    const cDate = c.createdAt || c.created_at;
    if (!cDate) return true;
    const d = new Date(cDate);
    if (period === "week") return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalCommission = filtered.reduce((sum, c) => sum + Number(c.commissionAmount || c.commission_amount || 0), 0);
  const totalOrderValue = filtered.reduce((sum, c) => sum + Number(c.orderAmount || c.order_amount || 0), 0);
  const avgRate = filtered.length > 0 
    ? (filtered.reduce((sum, c) => sum + Number(c.commissionRate || c.commission_rate || 0), 0) / filtered.length * 100).toFixed(1) 
    : "0";
  const peakCount = filtered.filter(c => c.isPeakHour || c.is_peak_hour).length;

  // Monthly commission chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = monthNames.map((name, idx) => {
    const monthComm = commissions.filter(c => {
      const cDate = c.createdAt || c.created_at;
      if (!cDate) return false;
      const d = new Date(cDate);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === idx;
    });
    return {
      month: name,
      commission: monthComm.reduce((sum, c) => sum + Number(c.commissionAmount || c.commission_amount || 0), 0),
      orders: monthComm.length,
    };
  });

  // Area breakdown
  const areaMap = new Map();
  filtered.forEach(c => {
    const area = c.area || "Standard Area";
    areaMap.set(area, (areaMap.get(area) || 0) + Number(c.commissionAmount || c.commission_amount || 0));
  });
  const areaData = [...areaMap.entries()]
    .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ["#3b82f6", "#818cf8", "#f59e0b", "#10b981", "#ef4444", "#a855f7"];

  const periodTabs = [
    { key: "all", label: "All Time" },
    { key: "month", label: "This Month" },
    { key: "week", label: "This Week" },
  ];

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedCommissions = filtered.slice(startIdx, endIdx);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(1);
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Commission Dashboard</h2>
          <p className="text-slate-400 text-sm mt-0.5">Automatic commission on every delivered order</p>
        </div>
        <div className="flex gap-1.5">
          {periodTabs.map(t => (
            <button 
              key={t.key} 
              onClick={() => { setPeriod(t.key); setCurrentPage(1); }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === t.key 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Commission Formula Card */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-blue-600/10 flex items-center justify-center shrink-0 border border-blue-500/10">
            <Info className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">Commission Formula</h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              <span className="font-bold text-white">Base: 5% / 8% (Peak Hour)</span> · Peak hour (6 PM - 9 PM) automatically adds a premium commission rate of 8% to fund logistics services and platform growth.
            </p>
            <div className="flex gap-3 mt-3 flex-wrap">
              {[
                { label: "Standard Rate", rate: "5%", color: "bg-blue-600/10 text-blue-400 border border-blue-500/10" },
                { label: "Peak Hour Rate", rate: "8%", color: "bg-amber-600/10 text-amber-400 border border-amber-500/10" },
                { label: "Peak Hours Window", rate: "6 PM - 9 PM", color: "bg-indigo-600/10 text-indigo-400 border border-indigo-500/10" },
              ].map(b => (
                <span key={b.label} className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${b.color}`}>
                  {b.label}: {b.rate}
                </span>
              ))}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: IndianRupee, label: "Commission Earned", value: `₹${Math.round(totalCommission).toLocaleString()}`, gradient: "from-emerald-500/10 via-emerald-400/5 to-transparent", iconBg: "bg-emerald-500/10", iconColor: "text-emerald-400" },
          { icon: Package, label: "Orders Tracked", value: filtered.length, gradient: "from-blue-500/10 via-blue-500/5 to-transparent", iconBg: "bg-blue-500/10", iconColor: "text-blue-400" },
          { icon: TrendingUp, label: "Avg Rate", value: `${avgRate}%`, gradient: "from-amber-500/10 via-amber-500/5 to-transparent", iconBg: "bg-amber-500/10", iconColor: "text-amber-400" },
          { icon: Zap, label: "Peak Orders", value: peakCount, gradient: "from-indigo-500/10 via-indigo-500/5 to-transparent", iconBg: "bg-indigo-500/10", iconColor: "text-indigo-400" },
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

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Monthly Commission</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <YAxis tick={{ fontSize: 11, fill: "#94a3b8" }} stroke="rgba(255,255,255,0.1)" />
              <Tooltip contentStyle={{ background: "#0e142e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, fontSize: 12, color: "#fff" }} formatter={(v) => [`₹${v}`, "Commission"]} />
              <Area type="monotone" dataKey="commission" stroke="#10b981" fill="url(#commGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <h3 className="font-bold text-white mb-4">Commission by Area</h3>
          {areaData.length > 0 ? (
            <div className="flex flex-col sm:flex-row items-center justify-around gap-6 h-[200px] sm:h-auto">
              <ResponsiveContainer width="100%" height={180} className="max-w-[180px]">
                <PieChart>
                  <Pie data={areaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {areaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1 shrink-0">
                {areaData.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs text-slate-400 font-semibold truncate max-w-[120px]">{a.name}</span>
                    <span className="font-bold text-xs text-white ml-auto">₹{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No commission data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Commission Records */}
      <motion.div variants={item}>
        <h3 className="font-bold text-white text-lg mb-3">Commission Records</h3>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-[#0e142e]/30 border border-white/5 rounded-3xl shadow-md">
            <IndianRupee className="h-12 w-12 mx-auto text-slate-600 mb-2.5" />
            <p className="font-bold text-white text-base">No commissions yet</p>
            <p className="text-sm text-slate-500 mt-1">Commissions are auto-generated when orders are delivered</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Showing {startIdx + 1}-{Math.min(endIdx, filtered.length)} of {filtered.length} record{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage >= totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2.5">
              {paginatedCommissions.map((c) => {
                const cId = c.id || c._id;
                const isPeak = c.isPeakHour || c.is_peak_hour;
                const rate = c.commissionRate || c.commission_rate || 0.05;
                const orderId = c.order?._id || c.order || c.order_id || "";
                const cDate = c.createdAt || c.created_at;
                const amount = c.commissionAmount || c.commission_amount || 0;
                const orderVal = c.orderAmount || c.order_amount || 0;

                return (
                  <motion.div 
                    key={cId} 
                    variants={item}
                    className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 hover:shadow-lg transition-shadow shadow-md"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 border ${
                          isPeak 
                            ? "bg-amber-500/10 border-amber-500/10" 
                            : "bg-emerald-500/10 border-emerald-500/10"
                        }`}>
                          {isPeak ? <Zap className="h-5 w-5 text-amber-400" /> : <IndianRupee className="h-5 w-5 text-emerald-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-white text-sm">Order #{orderId.slice(-8).toUpperCase()}</span>
                            <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-blue-500/10 text-blue-400 border border-blue-500/10">
                              {(rate * 100).toFixed(0)}% rate
                            </span>
                            {isPeak && (
                              <span className="px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/10">⚡ Peak</span>
                            )}
                          </div>
                          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-xs text-slate-500 mt-1 font-semibold">
                            {c.area && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" />{c.area}</span>}
                            <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5 text-slate-500" />{new Date(cDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                            <span className="text-slate-400">Order: ₹{Number(orderVal).toLocaleString()}</span>
                          </div>
                          {c.formulaBreakdown || c.formula_breakdown ? (
                            <p className="text-[10px] text-slate-500 mt-1 italic font-semibold">{c.formulaBreakdown || c.formula_breakdown}</p>
                          ) : null}
                        </div>
                      </div>
                      <span className="font-bold text-emerald-400 text-lg shrink-0">+₹{Number(amount).toFixed(0)}</span>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
