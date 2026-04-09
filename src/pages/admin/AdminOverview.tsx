import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp, Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function AdminOverview() {
  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
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

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const today = new Date().toISOString().slice(0, 10);
  const ordersToday = orders.filter(o => o.created_at.slice(0, 10) === today).length;
  const avgRating = suppliers.length ? (suppliers.reduce((s, sup) => s + Number(sup.rating), 0) / suppliers.length).toFixed(1) : "0";

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: orders.length.toLocaleString(), gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Users, label: "Users", value: profiles.length.toLocaleString(), gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { icon: Truck, label: "Suppliers", value: suppliers.length.toString(), gradient: "from-success/20 to-success/5", iconColor: "text-success" },
    { icon: IndianRupee, label: "Revenue", value: `₹${(totalRevenue / 1000).toFixed(0)}K`, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
    { icon: TrendingUp, label: "Today", value: ordersToday.toString(), gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Star, label: "Avg Rating", value: avgRating, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
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
              <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center">
                <s.icon className={`h-6 w-6 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-heading font-bold">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div>
        <h3 className="font-heading font-semibold text-lg mb-4">Recent Orders</h3>
        {orders.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">No orders yet.</p>
        ) : (
          <div className="space-y-3">
            {orders.slice(0, 10).map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{order.quantity} cans · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</p>
                </div>
                <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
