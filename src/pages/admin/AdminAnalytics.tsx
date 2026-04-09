import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star, TrendingUp, Package, IndianRupee, Users, Calendar, Droplets } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminAnalytics() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["admin-feedbacks-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback").select("rating, supplier_id");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-analytics"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("created_at");
      if (error) throw error;
      return data;
    },
  });

  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  const ordersPerMonth = monthNames.map((name, idx) => {
    const count = orders.filter(o => { const d = new Date(o.created_at); return d.getFullYear() === currentYear && d.getMonth() === idx; }).length;
    const revenue = orders.filter(o => { const d = new Date(o.created_at); return d.getFullYear() === currentYear && d.getMonth() === idx && o.status === "delivered"; })
      .reduce((s, o) => s + Number(o.total_amount), 0);
    return { month: name, orders: count, revenue };
  });

  const statusData = [
    { name: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "hsl(var(--success))" },
    { name: "Active", value: orders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "hsl(var(--primary))" },
    { name: "Cancelled", value: orders.filter(o => o.status === "cancelled").length, color: "hsl(var(--destructive))" },
  ].filter(s => s.value > 0);

  const ratingDist = [1, 2, 3, 4, 5].map(r => ({ rating: `${r}★`, count: feedbacks.filter(f => f.rating === r).length }));

  const supplierRevenue = suppliers.map(s => ({
    name: s.business_name.length > 12 ? s.business_name.slice(0, 12) + "…" : s.business_name,
    revenue: orders.filter(o => o.supplier_id === s.id && o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "N/A";
  const satisfactionPct = feedbacks.length ? Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100) : 0;
  const totalCansDelivered = orders.filter(o => o.status === "delivered").reduce((s, o) => s + o.quantity, 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold">Platform Analytics</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Detailed insights across all operations</p>
      </motion.div>

      {/* Key Metrics */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { icon: Star, label: "Avg Rating", value: `${avgRating}/5`, gradient: "from-warning/20 via-warning/10 to-transparent", iconBg: "bg-warning/15", iconColor: "text-warning" },
          { icon: TrendingUp, label: "Satisfaction", value: `${satisfactionPct}%`, gradient: "from-success/20 via-success/10 to-transparent", iconBg: "bg-success/15", iconColor: "text-success" },
          { icon: Users, label: "Total Reviews", value: feedbacks.length, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
          { icon: Droplets, label: "Cans Delivered", value: totalCansDelivered, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
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

      {/* Charts Grid */}
      <div className="grid lg:grid-cols-2 gap-4">
        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Revenue Trend ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={ordersPerMonth}>
              <defs>
                <linearGradient id="analyticsRevGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#analyticsRevGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Order Status</h3>
          {statusData.length > 0 ? (
            <div className="flex items-center gap-6">
              <ResponsiveContainer width="50%" height={200}>
                <PieChart>
                  <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={70} innerRadius={35}>
                    {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {statusData.map(s => (
                  <div key={s.name} className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                    <span className="text-sm">{s.name}</span>
                    <span className="font-heading font-bold text-sm ml-auto">{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground"><Package className="h-10 w-10 mx-auto mb-2 opacity-30" /><p className="text-sm">No data</p></div>
          )}
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={ratingDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <h3 className="font-heading font-semibold mb-4">Top Suppliers by Revenue</h3>
          {supplierRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={supplierRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={90} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12, fontSize: 12 }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground"><p className="text-sm">No data</p></div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
