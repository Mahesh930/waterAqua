import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Droplets,
  MapPin,
  Navigation,
  Package,
  Phone,
  Truck,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const statusSteps = [
  { key: "placed", label: "Order Placed", icon: Package, description: "Waiting for supplier to confirm your order", color: "text-warning" },
  { key: "confirmed", label: "Confirmed", icon: CheckCircle2, description: "Supplier accepted - preparing your delivery", color: "text-primary" },
  { key: "out_for_delivery", label: "On the Way", icon: Truck, description: "Your water tanker is heading to you.", color: "text-accent" },
  { key: "delivered", label: "Delivered", icon: Droplets, description: "Water delivered successfully.", color: "text-success" },
];

const statusIndex: Record<string, number> = {
  placed: 0,
  confirmed: 1,
  out_for_delivery: 2,
  delivered: 3,
  cancelled: -1,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.1 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };
const itemsPerPage = 5;

export default function TrackOrder() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [tab, setTab] = useState<"active" | "all">("active");
  const [currentPage, setCurrentPage] = useState(1);

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: "cancelled" as any })
      .eq("id", orderId)
      .eq("customer_id", user!.id);

    if (error) {
      toast({ title: "Cancel failed", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Order Cancelled", description: "Your order has been cancelled successfully." });
    queryClient.invalidateQueries({ queryKey: ["active-orders"] });
    queryClient.invalidateQueries({ queryKey: ["all-customer-orders"] });
  };

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

  const { data: allOrders = [], isLoading: allOrdersLoading } = useQuery({
    queryKey: ["all-customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area, delivery_time, driver_phone, vehicle_number, tanker_capacity)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("track-orders-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` }, () => {
        queryClient.invalidateQueries({ queryKey: ["active-orders"] });
        queryClient.invalidateQueries({ queryKey: ["all-customer-orders"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, queryClient]);

  const totalPages = Math.max(1, Math.ceil(allOrders.length / itemsPerPage));
  const pagedOrders = allOrders.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold">Live Tracking</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Track your water deliveries in real-time.</p>
      </motion.div>

      <motion.div variants={item} className="flex gap-2">
        <button
          onClick={() => {
            setTab("active");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "active" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          <Truck className="h-4 w-4" /> Active Orders ({activeOrders.length})
        </button>
        <button
          onClick={() => {
            setTab("all");
            setCurrentPage(1);
          }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            tab === "all" ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
          }`}
        >
          <Package className="h-4 w-4" /> All Orders ({allOrders.length})
        </button>
      </motion.div>

      {tab === "active" ? (
        <>
          {isLoading ? (
            <LoadingState label="Loading deliveries..." />
          ) : activeOrders.length === 0 ? (
            <motion.div variants={item} className="text-center py-16">
              <div className="relative mx-auto w-24 h-24 mb-5">
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-card flex items-center justify-center">
                  <Truck className="h-10 w-10 text-muted-foreground/30" />
                </div>
              </div>
              <p className="font-heading font-bold text-xl">No active deliveries</p>
              <p className="text-muted-foreground text-sm mt-1 mb-5">Book a water delivery to start tracking.</p>
              <Link to="/customer/order">
                <Button className="rounded-xl gap-2 shadow-lg shadow-primary/20">
                  <Zap className="h-4 w-4" /> Book Now
                </Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-5">{activeOrders.map((order, idx) => renderOrderCard(order, idx))}</div>
          )}
        </>
      ) : (
        <>
          {allOrdersLoading ? (
            <LoadingState label="Loading orders..." />
          ) : allOrders.length === 0 ? (
            <div className="text-center py-16">
              <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
              <p className="font-heading font-bold text-xl">No orders yet</p>
              <p className="text-muted-foreground text-sm mt-1">Your orders will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1}-{Math.min(currentPage * itemsPerPage, allOrders.length)} of {allOrders.length}
                </p>
                <div className="flex items-center gap-1.5">
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <div className="text-xs font-medium px-2">
                    Page {currentPage} of {totalPages}
                  </div>
                  <Button variant="outline" size="sm" className="h-8 px-2" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-5">{pagedOrders.map((order, idx) => renderOrderCard(order, idx))}</div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );

  function renderOrderCard(order: any, idx: number) {
    const supplierData = Array.isArray(order.suppliers) ? order.suppliers[0] : order.suppliers;
    const currentIdx = statusIndex[order.status] ?? 0;
    const isCancelled = order.status === "cancelled";
    const progressPercent = isCancelled ? 0 : (Math.max(0, currentIdx) / (statusSteps.length - 1)) * 100;

    return (
      <motion.div key={order.id} variants={item} className="glass-card rounded-2xl overflow-hidden border border-border/50" transition={{ delay: idx * 0.05 }}>
        <div className="p-5 border-b border-border/50">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="h-12 w-12 rounded-2xl bg-card shadow-md flex items-center justify-center border border-border/50 shrink-0">
                <Truck className="h-6 w-6 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold truncate">{supplierData?.business_name ?? "Supplier"}</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                  <span>{order.quantity} unit{order.quantity > 1 ? "s" : ""}</span>
                  <span>-</span>
                  <span className="font-heading font-bold text-foreground">Rs. {Number(order.total_amount)}</span>
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="text-[10px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-md">#{order.id.slice(0, 6)}</span>
              <p className="text-[10px] text-muted-foreground mt-1">
                {new Date(order.created_at).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          </div>

          <div className="mt-4 h-2 rounded-full bg-muted/60 overflow-hidden">
            <motion.div
              className={`h-full rounded-full ${isCancelled ? "bg-destructive" : "bg-gradient-to-r from-primary via-blue-500 to-accent"}`}
              initial={{ width: "0%" }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 1, ease: "easeOut", delay: idx * 0.2 }}
            />
          </div>
          <div className="flex justify-between mt-1.5 text-[10px] text-muted-foreground">
            <span>Placed</span>
            <span>Confirmed</span>
            <span>On the Way</span>
            <span>Delivered</span>
          </div>
        </div>

        <div className="p-5">
          {isCancelled ? (
            <div className="flex items-center gap-3 text-destructive">
              <XCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Order Cancelled</p>
                <p className="text-xs text-muted-foreground mt-0.5">This delivery is no longer active.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-0">
              {statusSteps.map((step, i) => {
                const StepIcon = step.icon;
                const isCompleted = i <= currentIdx;
                const isCurrent = i === currentIdx;
                const isLast = i === statusSteps.length - 1;

                return (
                  <div key={step.key} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.3 + i * 0.15 }}
                        className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                          isCurrent
                            ? "bg-primary text-primary-foreground ring-4 ring-primary/20 shadow-lg shadow-primary/30"
                            : isCompleted
                              ? "bg-primary/15 text-primary"
                              : "bg-muted/60 text-muted-foreground/40"
                        }`}
                      >
                        {isCompleted ? <StepIcon className="h-4 w-4" /> : <Circle className="h-3 w-3" />}
                      </motion.div>
                      {!isLast && <div className={`w-0.5 h-8 transition-colors ${isCompleted && i < currentIdx ? "bg-primary/30" : "bg-muted/60"}`} />}
                    </div>
                    <div className={`pb-3 ${isCurrent ? "" : isCompleted ? "opacity-70" : "opacity-30"}`}>
                      <p className={`text-sm font-semibold ${isCurrent ? step.color : ""}`}>{step.label}</p>
                      {isCurrent && (
                        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-xs text-muted-foreground mt-0.5">
                          {step.description}
                        </motion.p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {(supplierData?.driver_phone || supplierData?.vehicle_number) && order.status !== "placed" && !isCancelled && (
          <div className="px-5 pb-4">
            <div className="rounded-xl bg-gradient-to-r from-muted/50 to-muted/20 border border-border/50 p-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-2">Driver Details</p>
              <div className="flex items-center gap-4 flex-wrap">
                {supplierData?.driver_phone && (
                  <a href={`tel:${supplierData.driver_phone}`} className="flex items-center gap-2 text-sm font-medium text-primary hover:underline bg-primary/5 px-3 py-1.5 rounded-lg">
                    <Phone className="h-3.5 w-3.5" /> {supplierData.driver_phone}
                  </a>
                )}
                {supplierData?.vehicle_number && (
                  <span className="flex items-center gap-2 text-sm font-medium bg-muted/50 px-3 py-1.5 rounded-lg">
                    <Truck className="h-3.5 w-3.5 text-muted-foreground" /> {supplierData.vehicle_number}
                  </span>
                )}
                {supplierData?.tanker_capacity && (
                  <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Droplets className="h-3 w-3" /> {supplierData.tanker_capacity}L
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="px-5 pb-5 flex items-center gap-3 flex-wrap">
          {order.delivery_address && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 px-3 py-1.5 rounded-lg">
              <MapPin className="h-3 w-3 text-primary shrink-0" />
              <span className="truncate max-w-[200px]">{order.delivery_address}</span>
            </div>
          )}
          {supplierData?.delivery_time && order.status !== "delivered" && !isCancelled && (
            <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10">
              <Clock className="h-3 w-3" /> ETA: {supplierData.delivery_time}
            </div>
          )}
          {(order.status === "placed" || order.status === "confirmed") && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="sm" variant="outline" className="ml-auto rounded-lg gap-1.5 text-xs h-8 text-destructive border-destructive/30 hover:bg-destructive/10 hover:text-destructive">
                  <XCircle className="h-3.5 w-3.5" /> Cancel Order
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this order?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Order #{order.id.slice(0, 6)} from {supplierData?.business_name ?? "supplier"} will be cancelled.
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Keep Order</AlertDialogCancel>
                  <AlertDialogAction onClick={() => cancelOrder(order.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, Cancel
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </motion.div>
    );
  }
}

function LoadingState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="relative">
        <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full" />
        <Navigation className="absolute inset-0 m-auto h-5 w-5 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}
