import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  out_for_delivery: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function AdminOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">All Orders</h2>
        <p className="text-muted-foreground">Monitor all platform tanker orders.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">No orders yet.</p>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Order {order.id.slice(0, 8)}</span>
                  <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.suppliers?.business_name ?? "Unknown"} · {order.quantity} cans · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                </p>
              </div>
              <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
