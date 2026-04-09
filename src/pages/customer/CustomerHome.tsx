import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Truck, Clock, ArrowRight, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  out_for_delivery: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function CustomerHome() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Real-time order updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("customer-home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["customer-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: orders.length, color: "from-primary/20 to-primary/5", iconColor: "text-primary" },
    { icon: Truck, label: "Active", value: activeOrders.length, color: "from-accent/20 to-accent/5", iconColor: "text-accent" },
    { icon: Clock, label: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "from-success/20 to-success/5", iconColor: "text-success" },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">
          Welcome{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
        </h2>
        <p className="text-muted-foreground">Your water tanker delivery overview.</p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
            className={`glass-card rounded-2xl p-5 bg-gradient-to-br ${s.color}`}>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center">
                <s.icon className={`h-6 w-6 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-3xl font-heading font-bold">{s.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-lg mb-4">Active Orders</h3>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Droplets className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">{order.suppliers?.business_name ?? "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{order.quantity} cans · ₹{order.total_amount}</p>
                  </div>
                </div>
                <span className={`px-3 py-1.5 rounded-xl text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/customer/suppliers">
          <Button className="gap-2 rounded-xl">Browse Suppliers <ArrowRight className="h-4 w-4" /></Button>
        </Link>
        <Link to="/customer/order">
          <Button variant="outline" className="rounded-xl glass">Place Order</Button>
        </Link>
      </div>
    </div>
  );
}
