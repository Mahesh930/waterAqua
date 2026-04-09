import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminOverview() {
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

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["admin-feedbacks"],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback").select("rating");
      if (error) throw error;
      return data;
    },
  });

  const totalRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter(o => o.created_at.slice(0, 10) === today).length;
  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "0";
  const satisfactionRate = feedbacks.length ? Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100) : 0;

  // Monthly revenue data for chart
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentYear = new Date().getFullYear();
  const monthlyRevenue = monthNames.map((name, idx) => {
    const monthOrders = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === idx && o.status === "delivered";
    });
    return { month: name, revenue: monthOrders.reduce((s, o) => s + Number(o.total_amount), 0), orders: monthOrders.length };
  });

  // Daily orders for last 14 days
  const dailyData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const dateStr = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
    return { date: label, orders: orders.filter(o => o.created_at.slice(0, 10) === dateStr).length };
  });

  // Top suppliers
  const topSuppliers = [...suppliers]
    .sort((a, b) => Number(b.rating) - Number(a.rating))
    .slice(0, 5);

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: orders.length.toLocaleString(), gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Users, label: "Users", value: profiles.length.toLocaleString(), gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { icon: Truck, label: "Suppliers", value: suppliers.length.toString(), gradient: "from-success/20 to-success/5", iconColor: "text-success" },
    { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue > 1000 ? (totalRevenue / 1000).toFixed(1) + "K" : totalRevenue}`, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
    { icon: TrendingUp, label: "Today", value: ordersToday.toString(), gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Star, label: "Satisfaction", value: `${satisfactionRate}%`, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Admin Overview</h2>
        <p className="text-muted-foreground">Platform-wide analytics and metrics.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${s.gradient}`}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><s.icon className={`h-6 w-6 ${s.iconColor}`} /></div>
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-heading font-bold">{s.value}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Revenue Trend ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={monthlyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Orders (Last 14 Days)</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dailyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Suppliers */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="font-heading font-semibold mb-4">Top-Rated Suppliers</h3>
        {topSuppliers.length === 0 ? (
          <p className="text-muted-foreground text-center py-4">No suppliers yet.</p>
        ) : (
          <div className="space-y-3">
            {topSuppliers.map((s, i) => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-heading font-bold text-muted-foreground w-8">#{i + 1}</span>
                  <div>
                    <p className="font-medium">{s.business_name}</p>
                    <p className="text-sm text-muted-foreground">{s.area}</p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-heading font-bold">{Number(s.rating).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({s.review_count})</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
