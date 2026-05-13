import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Truck, MapPin, CheckCheck, Clock, Package, ChevronRight, Phone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  placed: "⏳ Pending",
  confirmed: "✅ Confirmed",
  out_for_delivery: "🚛 On the Way",
  delivered: "📦 Delivered",
  cancelled: "❌ Cancelled",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function ManageOrders() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["supplier-orders", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("supplier_id", supplier!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  // Realtime
  useEffect(() => {
    if (!supplier) return;
    const channel = supabase
      .channel("manage-orders-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `supplier_id=eq.${supplier.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["supplier-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supplier, queryClient]);

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pendingOrders = filtered.filter(o => o.status === "placed");
  const selectedPending = pendingOrders.filter(o => selected.has(o.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => { const next = new Set(prev); if (next.has(id)) next.delete(id); else next.add(id); return next; });
  };

  const toggleSelectAll = () => {
    if (selectedPending.length === pendingOrders.length && pendingOrders.length > 0) setSelected(new Set());
    else setSelected(new Set(pendingOrders.map(o => o.id)));
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status: status as any }).eq("id", orderId);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Status Updated", description: `Order → ${statusLabels[status]}` }); queryClient.invalidateQueries({ queryKey: ["supplier-orders"] }); }
  };

  const bulkAccept = async () => {
    if (selectedPending.length === 0) return;
    const ids = selectedPending.map(o => o.id);
    const { error } = await supabase.from("orders").update({ status: "confirmed" as any }).in("id", ids);
    if (error) toast({ title: "Bulk accept failed", description: error.message, variant: "destructive" });
    else { toast({ title: `${ids.length} orders accepted! 🎉` }); setSelected(new Set()); queryClient.invalidateQueries({ queryKey: ["supplier-orders"] }); }
  };

  const filterTabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "placed", label: "Pending", count: orders.filter(o => o.status === "placed").length },
    { key: "confirmed", label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length },
    { key: "out_for_delivery", label: "Dispatched", count: orders.filter(o => o.status === "out_for_delivery").length },
    { key: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Manage Orders</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Accept, dispatch, and track all your orders</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === t.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === t.key ? "bg-white/20" : "bg-muted"}`}>{t.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {pendingOrders.length > 0 && (
          <motion.div variants={item} className="glass-card rounded-2xl p-3 flex items-center gap-3 flex-wrap">
            <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={toggleSelectAll}>
              <CheckCheck className="h-3.5 w-3.5" />
              {selectedPending.length === pendingOrders.length ? "Deselect All" : `Select All (${pendingOrders.length})`}
            </Button>
            {selectedPending.length > 0 && (
              <Button size="sm" className="rounded-xl gap-1.5 shadow-md shadow-primary/10" onClick={bulkAccept}>
                <Check className="h-3.5 w-3.5" /> Accept {selectedPending.length} Order{selectedPending.length > 1 ? "s" : ""}
              </Button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Orders List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">Orders will appear here when customers book.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id} variants={item}
              whileHover={{ y: -2, transition: { duration: 0.2 } }}
              className={`glass-card rounded-2xl overflow-hidden transition-all ${selected.has(order.id) ? "ring-2 ring-primary/50 shadow-lg shadow-primary/10" : ""}`}>
              
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {order.status === "placed" && (
                      <Checkbox checked={selected.has(order.id)} onCheckedChange={() => toggleSelect(order.id)} className="mt-0.5" />
                    )}
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-lg shrink-0">📦</div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm">#{order.id.slice(0, 8)}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                        <span className="font-medium">{order.quantity} units</span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}</span>
                      </div>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-primary text-lg">₹{Number(order.total_amount)}</span>
                </div>

                {order.delivery_address && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-xl p-2.5">
                    <MapPin className="h-3.5 w-3.5 text-primary/60 shrink-0 mt-0.5" />
                    <span>{order.delivery_address}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  {order.status === "placed" && (
                    <>
                      <Button size="sm" className="gap-1.5 rounded-xl flex-1 shadow-md shadow-primary/10" onClick={() => updateStatus(order.id, "confirmed")}>
                        <Check className="h-3.5 w-3.5" /> Accept
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl" onClick={() => updateStatus(order.id, "cancelled")}>
                        <X className="h-3.5 w-3.5" /> Reject
                      </Button>
                    </>
                  )}
                  {order.status === "confirmed" && (
                    <Button size="sm" className="gap-1.5 rounded-xl flex-1 shadow-md shadow-primary/10" onClick={() => updateStatus(order.id, "out_for_delivery")}>
                      <Truck className="h-3.5 w-3.5" /> Dispatch Now
                    </Button>
                  )}
                  {order.status === "out_for_delivery" && (
                    <Button size="sm" variant="outline" className="gap-1.5 rounded-xl flex-1 glass" onClick={() => updateStatus(order.id, "delivered")}>
                      <Check className="h-3.5 w-3.5" /> Mark Delivered
                    </Button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-muted">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  initial={{ width: "0%" }}
                  animate={{
                    width: order.status === "placed" ? "25%" :
                           order.status === "confirmed" ? "50%" :
                           order.status === "out_for_delivery" ? "75%" : "100%"
                  }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
