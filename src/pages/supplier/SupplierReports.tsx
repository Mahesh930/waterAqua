import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { FileText, TrendingUp, Package, Star, IndianRupee } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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

  // Monthly data
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const yearOrders = orders.filter(o => new Date(o.created_at).getFullYear().toString() === year);
  const monthlyData = monthNames.map((name, idx) => {
    const monthOrders = yearOrders.filter(o => new Date(o.created_at).getMonth() === idx);
    return {
      month: name,
      orders: monthOrders.length,
      revenue: monthOrders.reduce((s, o) => s + Number(o.total_amount), 0),
    };
  });

  // Status breakdown
  const statusCounts = [
    { name: "Delivered", value: yearOrders.filter(o => o.status === "delivered").length, color: "hsl(var(--success))" },
    { name: "Active", value: yearOrders.filter(o => ["placed", "confirmed", "out_for_delivery"].includes(o.status)).length, color: "hsl(var(--primary))" },
    { name: "Cancelled", value: yearOrders.filter(o => o.status === "cancelled").length, color: "hsl(var(--destructive))" },
  ].filter(s => s.value > 0);

  const avgRating = feedbacks.length ? (feedbacks.reduce((s, f) => s + f.rating, 0) / feedbacks.length).toFixed(1) : "N/A";
  const totalRevenue = yearOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);

  const years = [...new Set(orders.map(o => new Date(o.created_at).getFullYear().toString()))];
  if (!years.includes(year)) years.push(year);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-heading text-3xl font-bold mb-1">Monthly Reports</h2>
          <p className="text-muted-foreground">Analyze your business performance over time.</p>
        </motion.div>
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger className="w-32 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            {years.sort().map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Total Orders", value: yearOrders.length, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
          { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue}`, gradient: "from-success/20 to-success/5", iconColor: "text-success" },
          { icon: Star, label: "Avg Rating", value: avgRating, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
          { icon: TrendingUp, label: "Reviews", value: feedbacks.length, gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${s.gradient}`}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><s.icon className={`h-6 w-6 ${s.iconColor}`} /></div>
              <div><p className="text-sm text-muted-foreground">{s.label}</p><p className="text-2xl font-heading font-bold">{s.value}</p></div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Monthly Revenue</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 12 }} />
              <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card rounded-2xl p-6">
          <h3 className="font-heading font-semibold mb-4">Order Status Breakdown</h3>
          {statusCounts.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={statusCounts} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {statusCounts.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-16">No orders this year.</p>
          )}
        </div>
      </div>
    </div>
  );
}
