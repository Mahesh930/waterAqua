import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  MapPin, Phone, Truck, Clock, CheckCircle2, Package, 
  Droplets, ArrowRight, Circle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const statusSteps = [
  { key: "placed", label: "Order Placed", icon: Package, description: "Waiting for supplier confirmation" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Supplier accepted your order" },
  { key: "out_for_delivery", label: "On the Way", icon: Truck, description: "Your water is being delivered" },
  { key: "delivered", label: "Delivered", icon: Droplets, description: "Water delivered successfully!" },
];

const statusIndex: Record<string, number> = {
  placed: 0, confirmed: 1, out_for_delivery: 2, delivered: 3, cancelled: -1,
};

export default function TrackOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: activeOrders = [], isLoading } = useQuery({
    queryKey: ["active-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area, delivery_time, driver_phone, vehicle_number, tanker_capacity)")
        .eq("customer_id", user!.id)
        .not("status", "in", '("delivered","cancelled")')
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 10000,
  });

  // Real-time updates
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("track-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["active-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-2xl font-bold">Live Tracking</h2>
        <p className="text-muted-foreground text-sm">Track your active water deliveries in real-time.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : activeOrders.length === 0 ? (
        <div className="text-center py-16">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Truck className="h-10 w-10 text-muted-foreground/40" />
          </div>
          <p className="font-heading font-semibold text-lg">No active deliveries</p>
          <p className="text-muted-foreground text-sm mt-1 mb-4">Book a water delivery to start tracking.</p>
          <Link to="/customer/order">
            <Button className="rounded-xl gap-2">Book Now <ArrowRight className="h-4 w-4" /></Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {activeOrders.map((order, idx) => {
            const currentIdx = statusIndex[order.status] ?? 0;
            const supplierData = order.suppliers as any;
            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden">
                
                {/* Header */}
                <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b border-border/30">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-11 w-11 rounded-xl bg-card/80 flex items-center justify-center text-xl">🚛</div>
                      <div>
                        <p className="font-heading font-semibold">{supplierData?.business_name ?? "Supplier"}</p>
                        <p className="text-xs text-muted-foreground">{order.quantity} {order.quantity > 1 ? "units" : "unit"} · ₹{Number(order.total_amount)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 6)}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(order.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Timeline */}
                <div className="p-4">
                  <div className="space-y-0">
                    {statusSteps.map((s, i) => {
                      const isCompleted = i <= currentIdx;
                      const isCurrent = i === currentIdx;
                      const isLast = i === statusSteps.length - 1;
                      return (
                        <div key={s.key} className="flex gap-3">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 transition-all ${
                              isCurrent ? "bg-primary text-primary-foreground ring-4 ring-primary/20" :
                              isCompleted ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                            }`}>
                              {isCompleted ? <s.icon className="h-3.5 w-3.5" /> : <Circle className="h-3 w-3" />}
                            </div>
                            {!isLast && (
                              <div className={`w-0.5 h-8 ${isCompleted && i < currentIdx ? "bg-primary/30" : "bg-muted"}`} />
                            )}
                          </div>
                          {/* Content */}
                          <div className={`pb-4 ${isCurrent ? "" : "opacity-60"}`}>
                            <p className={`text-sm font-medium ${isCurrent ? "text-primary" : ""}`}>{s.label}</p>
                            {isCurrent && (
                              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className="text-xs text-muted-foreground">{s.description}</motion.p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Driver & Vehicle Info */}
                {(supplierData?.driver_phone || supplierData?.vehicle_number) && order.status !== "placed" && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-muted/30 p-3 space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Driver Details</p>
                      <div className="flex items-center gap-4 flex-wrap">
                        {supplierData?.driver_phone && (
                          <a href={`tel:${supplierData.driver_phone}`}
                            className="flex items-center gap-1.5 text-sm text-primary hover:underline">
                            <Phone className="h-3.5 w-3.5" /> {supplierData.driver_phone}
                          </a>
                        )}
                        {supplierData?.vehicle_number && (
                          <span className="flex items-center gap-1.5 text-sm">
                            <Truck className="h-3.5 w-3.5 text-muted-foreground" /> {supplierData.vehicle_number}
                          </span>
                        )}
                        {supplierData?.tanker_capacity && (
                          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Droplets className="h-3 w-3" /> {supplierData.tanker_capacity}L capacity
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Delivery address */}
                {order.delivery_address && (
                  <div className="px-4 pb-4">
                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                      <span>{order.delivery_address}</span>
                    </div>
                  </div>
                )}

                {/* Estimated time */}
                {order.status !== "delivered" && supplierData?.delivery_time && (
                  <div className="px-4 pb-4">
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-2.5 flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-medium">Estimated: {supplierData.delivery_time}</span>
                    </div>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
