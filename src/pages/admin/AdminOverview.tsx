import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp, Star, Package, ChevronRight, Zap, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useAuth } from "@/contexts/AuthContext";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

export default function AdminOverview() {
  const { profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: commissions = [] } = useQuery({
    queryKey: ["admin-commissions-overview"],
    queryFn: async () => {
      const { data, error } = await supabase.from("admin_commissions").select("*").order("created_at", { ascending: false });
      if (error) return [];
      return data || [];
    },
  });

  // Realtime
  useEffect(() => {
    const channel = supabase
      .channel("admin-overview-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
        queryClient.invalidateQueries({ queryKey: ["admin-commissions-overview"] });
      }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const totalCommission = (commissions as any[]).reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0);
  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter(o => o.created_at.slice(0, 10) === today).length;
  const pendingOrders = orders.filter(o => o.status === "placed").length;
  const activeSuppliers = suppliers.filter(s => s.available && !s.blocked).length;

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: orders.length, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: IndianRupee, label: "Platform Revenue", value: `₹${totalRevenue > 1000 ? (totalRevenue / 1000).toFixed(1) + "K" : totalRevenue}`, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
    { icon: TrendingUp, label: "Commission Earned", value: `₹${totalCommission > 1000 ? (totalCommission / 1000).toFixed(1) + "K" : Math.round(totalCommission)}`, gradient: "from-warning/20 via-warning/10 to-transparent", iconBg: "bg-warning/15", iconColor: "text-warning" },
    { icon: Users, label: "Users", value: profiles.length, gradient: "from-violet-500/20 via-violet-400/10 to-transparent", iconBg: "bg-violet-500/15", iconColor: "text-violet-500" },
    { icon: Truck, label: "Active Suppliers", value: activeSuppliers, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
    { icon: Clock, label: "Pending Orders", value: pendingOrders, gradient: "from-destructive/20 via-destructive/10 to-transparent", iconBg: "bg-destructive/15", iconColor: "text-destructive" },
  ];

  const quickActions = [
    { icon: Package, label: "All Orders", desc: "Monitor & manage", path: "/admin/orders", color: "from-primary to-blue-600", ring: "ring-primary/20" },
    { icon: IndianRupee, label: "Commission", desc: "Track earnings", path: "/admin/commission", color: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/20" },
    { icon: Users, label: "Users", desc: "Manage accounts", path: "/admin/users", color: "from-violet-500 to-purple-600", ring: "ring-violet-500/20" },
    { icon: TrendingUp, label: "Analytics", desc: "Detailed insights", path: "/admin/analytics", color: "from-amber-500 to-orange-600", ring: "ring-amber-500/20" },
  ];

  // Chart data
  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthlyData = monthNames.map((name, idx) => {
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === idx && o.status === "delivered";
    });
    const monthCommissions = (commissions as any[]).filter((c: any) => {
      const d = new Date(c.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    });
    return {
      month: name,
      revenue: monthOrders.reduce((s, o) => s + Number(o.total_amount), 0),
      commission: monthCommissions.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0),
    };
  });

  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().slice(0, 10);
    return { date: d.toLocaleDateString("en-IN", { day: "numeric", month: "short" }), orders: orders.filter(o => o.created_at.slice(0, 10) === dateStr).length };
  });

  const topSuppliers = [...suppliers].sort((a, b) => Number(b.rating) - Number(a.rating)).slice(0, 5);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Hero Banner */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-accent p-6 sm:p-8 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Shield className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium bg-white/15 backdrop-blur px-2.5 py-0.5 rounded-full">
              Admin Dashboard
            </span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-3">
            Welcome{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}! 🎛️
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 max-w-md">
            {ordersToday} orders today · ₹{Math.round(totalCommission)} commission earned
          </p>
          <div className="flex gap-3 mt-5">
            <Link to="/admin/orders">
              <Button size="lg" className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold">
                <Package className="h-4 w-4" /> View Orders
              </Button>
            </Link>
            <Link to="/admin/commission">
              <Button size="lg" variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 gap-2">
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
                className={`glass-card rounded-2xl p-4 cursor-pointer group hover:shadow-xl transition-all duration-300 ring-1 ${action.ring} ring-inset`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-heading font-semibold text-sm">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item}>
        <h3 className="font-heading font-semibold text-lg mb-3">Platform Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${s.gradient}`}>
              <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-heading font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Revenue & Commission ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="comGradAdmin" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--warning))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--warning))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGradAdmin)" strokeWidth={2} name="Revenue" />
              <Area type="monotone" dataKey="commission" stroke="hsl(var(--warning))" fill="url(#comGradAdmin)" strokeWidth={2} name="Commission" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Daily Orders (14 days)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top Suppliers */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold">Top-Rated Suppliers</h3>
          <Link to="/admin/users" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        {topSuppliers.length === 0 ? (
          <p className="text-muted-foreground text-center py-6">No suppliers yet.</p>
        ) : (
          <div className="space-y-2">
            {topSuppliers.map((s, i) => (
              <div key={s.id} className="glass rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center font-heading font-bold text-sm text-primary">#{i + 1}</span>
                  <div>
                    <p className="font-medium text-sm">{s.business_name}</p>
                    <p className="text-xs text-muted-foreground">{s.area}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                  <span className="font-heading font-bold text-sm">{Number(s.rating).toFixed(1)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
