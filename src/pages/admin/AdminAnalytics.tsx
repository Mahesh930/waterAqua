import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Star } from "lucide-react";

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

  const currentYear = new Date().getFullYear();
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  // Orders per month
  const ordersPerMonth = monthNames.map((name, idx) => {
    const count = orders.filter(o => {
      const d = new Date(o.created_at);
      return d.getFullYear() === currentYear && d.getMonth() === idx;
    }).length;
    return { month: name, orders: count };
  });

  // Status distribution
  const statusData = [
    { name: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "hsl(var(--success))" },
    { name: "Active", value: orders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "hsl(var(--primary))" },
    { name: "Cancelled", value: orders.filter(o => o.status === "cancelled").length, color: "hsl(var(--destructive))" },
  ].filter(s => s.value > 0);

  // Rating distribution
  const ratingDist = [1, 2, 3, 4, 5].map(r => ({
    rating: `${r}★`,
    count: feedbacks.filter(f => f.rating === r).length,
  }));

  // Revenue per supplier (top 5)
  const supplierRevenue = suppliers.map(s => ({
    name: s.business_name.length > 12 ? s.business_name.slice(0, 12) + "…" : s.business_name,
    revenue: orders.filter(o => o.supplier_id === s.id && o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0),
  })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "N/A";
  const satisfactionPct = feedbacks.length ? Math.round((feedbacks.filter(f => f.rating >= 4).length / feedbacks.length) * 100) : 0;

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Analytics Dashboard</h2>
        <p className="text-muted-foreground">Detailed platform analytics and insights.</p>
      </motion.div>

      {/* Satisfaction summary */}
      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-warning/20 to-warning/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><Star className="h-6 w-6 text-warning" /></div>
            <div><p className="text-sm text-muted-foreground">Average Rating</p><p className="text-2xl font-heading font-bold">{avgRating}/5</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-success/20 to-success/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><Star className="h-6 w-6 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Satisfaction Rate</p><p className="text-2xl font-heading font-bold">{satisfactionPct}%</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><Star className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Total Reviews</p><p className="text-2xl font-heading font-bold">{feedbacks.length}</p></div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Orders per Month ({currentYear})</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ordersPerMonth}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Order Status Distribution</h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-16">No orders yet.</p>}
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Rating Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={ratingDist}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="rating" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="count" fill="hsl(var(--warning))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Revenue by Supplier (Top 5)</h3>
          {supplierRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={supplierRevenue} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={100} />
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} formatter={(v: any) => [`₹${v}`, "Revenue"]} />
                <Bar dataKey="revenue" fill="hsl(var(--accent))" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-muted-foreground text-center py-16">No suppliers yet.</p>}
        </div>
      </div>
    </div>
  );
}
