import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from "recharts";
import { TrendingUp, Package, Star, IndianRupee, Calendar, Droplets } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SupplierReports() {
  const { user } = useAuth();
  const [year, setYear] = useState(new Date().getFullYear().toString());

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["supplier-all-orders-report", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("supplier_id", supplier!.id).order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["supplier-feedback-report", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback").select("rating").eq("supplier_id", supplier!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearOrders = orders.filter(o => new Date(o.created_at).getFullYear().toString() === year);
  const monthlyData = monthNames.map((name, idx) => {
    const monthOrders = yearOrders.filter(o => new Date(o.created_at).getMonth() === idx);
    return {
      month: name,
      orders: monthOrders.length,
      revenue: monthOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0),
    };
  });

  const statusCounts = [
    { name: "Delivered", value: yearOrders.filter(o => o.status === "delivered").length, color: "hsl(var(--success))" },
    { name: "Active", value: yearOrders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "hsl(var(--primary))" },
    { name: "Cancelled", value: yearOrders.filter(o => o.status === "cancelled").length, color: "hsl(var(--destructive))" },
  ].filter(s => s.value > 0);

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "N/A";
  const totalRevenue = yearOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const totalCans = yearOrders.filter(o => o.status === "delivered").reduce((s, o) => s + o.quantity, 0);

  const years = [...new Set(orders.map(o => new Date(o.created_at).getFullYear().toString()))];
  if (!years.includes(year)) years.push(year);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Business Reports</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Analyze your performance and revenue trends</p>
        </div>
        <div className="flex gap-1.5">
          {years.sort().map(y => (
            <button key={y} onClick={() => setYear(y)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                year === y ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
              }`}>{y}</button>
          ))}
        </div>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Package, label: "Total Orders", value: yearOrders.length, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
          { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue}`, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
          { icon: Star, label: "Avg Rating", value: avgRating, gradient: "from-warning/20 via-warning/10 to-transparent", iconBg: "bg-warning/15", iconColor: "text-warning" },
          { icon: Droplets, label: "Cans Sold", value: totalCans, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
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
          <h3 className="font-heading font-semibold mb-4">Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#revGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Order Distribution</h3>
          {statusCounts.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={40}>
                    {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {statusCounts.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm">{s.name}</span>
                    <span className="font-heading font-bold text-sm ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No data for {year}</p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Monthly breakdown */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5">
        <h3 className="font-heading font-semibold mb-4">Monthly Orders</h3>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
            <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
