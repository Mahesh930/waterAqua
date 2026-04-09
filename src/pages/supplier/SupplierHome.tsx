import { Package, CheckCircle, Truck, IndianRupee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function SupplierHome() {
  const { user } = useAuth();

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["supplier-orders", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, profiles!orders_customer_id_fkey(full_name)")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      if (error) {
        // fallback without join
        const { data: d2, error: e2 } = await supabase
          .from("orders")
          .select("*")
          .eq("supplier_id", supplier!.id)
          .order("created_at", { ascending: false });
        if (e2) throw e2;
        return d2;
      }
      return data;
    },
    enabled: !!supplier,
  });

  const pending = orders.filter(o => o.status === "placed").length;
  const active = orders.filter(o => o.status === "confirmed" || o.status === "out_for_delivery").length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const revenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);

  const statusColors: Record<string, string> = {
    placed: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    out_for_delivery: "bg-accent/10 text-accent",
    delivered: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };

  const statusLabels: Record<string, string> = {
    placed: "Pending",
    confirmed: "Confirmed",
    out_for_delivery: "Dispatched",
    delivered: "Delivered",
    cancelled: "Cancelled",
  };

  const stats = [
    { icon: Package, label: "Pending", value: pending, gradient: "from-warning/20 to-warning/5", iconColor: "text-warning" },
    { icon: Truck, label: "Active", value: active, gradient: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: CheckCircle, label: "Delivered", value: delivered, gradient: "from-success/20 to-success/5", iconColor: "text-success" },
    { icon: IndianRupee, label: "Revenue", value: `₹${revenue}`, gradient: "from-accent/20 to-accent/5", iconColor: "text-accent" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Supplier Dashboard</h2>
        <p className="text-muted-foreground">Overview of your tanker orders and performance.</p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
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
            {orders.slice(0, 5).map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{order.quantity} cans · ₹{Number(order.total_amount)}</p>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
