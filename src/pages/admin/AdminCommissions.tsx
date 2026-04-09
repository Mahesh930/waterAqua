import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Clock, MapPin, Zap, Package, Calendar, Info } from "lucide-react";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminCommissions() {
  const [period, setPeriod] = useState<"all" | "month" | "week">("all");

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ["admin-commissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admin_commissions")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  const now = new Date();
  const filtered = (commissions as any[]).filter((c: any) => {
    if (period === "all") return true;
    const d = new Date(c.created_at);
    if (period === "week") return (now.getTime() - d.getTime()) < 7 * 24 * 60 * 60 * 1000;
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });

  const totalCommission = filtered.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
  const totalOrderValue = filtered.reduce((s: number, c: any) => s + Number(c.order_amount || 0), 0);
  const avgRate = filtered.length > 0 ? (filtered.reduce((s: number, c: any) => s + Number(c.commission_rate || 0), 0) / filtered.length * 100).toFixed(1) : "0";
  const peakCount = filtered.filter((c: any) => c.is_peak_hour).length;

  // Monthly commission chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = monthNames.map((name, idx) => {
    const monthComm = (commissions as any[]).filter((c: any) => {
      const d = new Date(c.created_at);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === idx;
    });
    return {
      month: name,
      commission: monthComm.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0),
      orders: monthComm.length,
    };
  });

  // Area breakdown
  const areaMap = new Map<string, number>();
  filtered.forEach((c: any) => {
    const area = c.area || "Unknown";
    areaMap.set(area, (areaMap.get(area) || 0) + Number(c.commission_amount || 0));
  });
  const areaData = [...areaMap.entries()]
    .map(([name, value]) => ({ name: name.length > 15 ? name.slice(0, 15) + "…" : name, value: Math.round(value) }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const COLORS = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--warning))", "hsl(var(--success))", "hsl(var(--destructive))", "hsl(210 60% 50%)"];

  const periodTabs = [
    { key: "all" as const, label: "All Time" },
    { key: "month" as const, label: "This Month" },
    { key: "week" as const, label: "This Week" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Commission Dashboard</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Automatic commission on every delivered order</p>
        </div>
        <div className="flex gap-1.5">
          {periodTabs.map(t => (
            <button key={t.key} onClick={() => setPeriod(t.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                period === t.key ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
              }`}>{t.label}</button>
          ))}
        </div>
      </motion.div>

      {/* Commission Formula Card */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 ring-1 ring-primary/10">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Info className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h3 className="font-heading font-semibold text-sm">Commission Formula</h3>
            <p className="text-xs text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">Base: 10%</span> + Area Bonus (Metro +2%, Tier-2 +1%) + Peak Hours +2% (6-10 AM, 5-9 PM IST)
            </p>
            <div className="flex gap-3 mt-2 flex-wrap">
              {[
                { label: "Metro", rate: "12-14%", color: "bg-primary/10 text-primary" },
                { label: "Tier-2", rate: "11-13%", color: "bg-accent/10 text-accent" },
                { label: "Standard", rate: "10-12%", color: "bg-muted text-muted-foreground" },
                { label: "Peak Bonus", rate: "+2%", color: "bg-warning/10 text-warning" },
              ].map(b => (
                <span key={b.label} className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${b.color}`}>
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
          { icon: IndianRupee, label: "Commission Earned", value: `₹${Math.round(totalCommission)}`, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
          { icon: Package, label: "Orders Tracked", value: filtered.length, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
          { icon: TrendingUp, label: "Avg Rate", value: `${avgRate}%`, gradient: "from-warning/20 via-warning/10 to-transparent", iconBg: "bg-warning/15", iconColor: "text-warning" },
          { icon: Zap, label: "Peak Orders", value: peakCount, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${s.gradient}`}>
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Monthly Commission</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="commGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`₹${v}`, "Commission"]} />
              <Area type="monotone" dataKey="commission" stroke="hsl(var(--success))" fill="url(#commGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Commission by Area</h3>
          {areaData.length > 0 ? (
            <div className="flex items-center gap-4">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={areaData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {areaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 flex-1">
                {areaData.map((a, i) => (
                  <div key={a.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                    <span className="text-xs truncate flex-1">{a.name}</span>
                    <span className="font-heading font-bold text-xs">₹{a.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <MapPin className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No commission data yet</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Commission Records */}
      <motion.div variants={item}>
        <h3 className="font-heading font-semibold text-lg mb-3">Commission Records</h3>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <IndianRupee className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="font-heading font-semibold">No commissions yet</p>
            <p className="text-sm text-muted-foreground mt-1">Commissions are auto-generated when orders are delivered</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.slice(0, 20).map((c: any) => (
              <motion.div key={c.id} variants={item}
                className="glass-card rounded-2xl p-4 hover:shadow-lg transition-shadow">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${c.is_peak_hour ? "bg-warning/10" : "bg-success/10"}`}>
                      {c.is_peak_hour ? <Zap className="h-5 w-5 text-warning" /> : <IndianRupee className="h-5 w-5 text-success" />}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm">Order #{c.order_id?.slice(0, 8)}</span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-primary/10 text-primary">
                          {(Number(c.commission_rate) * 100).toFixed(0)}% rate
                        </span>
                        {c.is_peak_hour && (
                          <span className="px-2 py-0.5 rounded-lg text-[10px] font-semibold bg-warning/10 text-warning">⚡ Peak</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                        {c.area && <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{c.area.length > 20 ? c.area.slice(0, 20) + "…" : c.area}</span>}
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{new Date(c.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                        <span>Order: ₹{Number(c.order_amount)}</span>
                      </div>
                      {c.formula_breakdown && (
                        <p className="text-[10px] text-muted-foreground/70 mt-0.5">{c.formula_breakdown}</p>
                      )}
                    </div>
                  </div>
                  <span className="font-heading font-bold text-success text-lg">+₹{Number(c.commission_amount).toFixed(0)}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
