import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Truck, MapPin, CheckCheck } from "lucide-react";
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
  placed: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function ManageOrders() {
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["supplier-orders", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const pendingOrders = filtered.filter(o => o.status === "placed");
  const selectedPending = pendingOrders.filter(o => selected.has(o.id));

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedPending.length === pendingOrders.length && pendingOrders.length > 0) {
      setSelected(new Set());
    } else {
      setSelected(new Set(pendingOrders.map(o => o.id)));
    }
  };

  const updateStatus = async (orderId: string, status: string) => {
    const { error } = await supabase
      .from("orders")
      .update({ status: status as any })
      .eq("id", orderId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Status Updated", description: `Order → ${statusLabels[status]}` });
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    }
  };

  const bulkAccept = async () => {
    if (selectedPending.length === 0) return;
    const ids = selectedPending.map(o => o.id);
    const { error } = await supabase
      .from("orders")
      .update({ status: "confirmed" as any })
      .in("id", ids);

    if (error) {
      toast({ title: "Bulk accept failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${ids.length} orders accepted!` });
      setSelected(new Set());
      queryClient.invalidateQueries({ queryKey: ["supplier-orders"] });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-heading text-3xl font-bold mb-1">Manage Orders</h2>
          <p className="text-muted-foreground">Accept, reject, and update tanker order statuses.</p>
        </motion.div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="placed">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="out_for_delivery">Dispatched</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions bar */}
      {pendingOrders.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="glass-card rounded-2xl p-3 flex items-center gap-3 flex-wrap">
          <Button variant="outline" size="sm" className="rounded-xl gap-1.5" onClick={toggleSelectAll}>
            <CheckCheck className="h-3.5 w-3.5" />
            {selectedPending.length === pendingOrders.length ? "Deselect All" : `Select All Pending (${pendingOrders.length})`}
          </Button>
          {selectedPending.length > 0 && (
            <Button size="sm" className="rounded-xl gap-1.5" onClick={bulkAccept}>
              <Check className="h-3.5 w-3.5" /> Accept {selectedPending.length} Order{selectedPending.length > 1 ? "s" : ""}
            </Button>
          )}
          {selectedPending.length > 0 && (
            <span className="text-xs text-muted-foreground">{selectedPending.length} selected</span>
          )}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No orders found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl p-4 space-y-3 transition-colors ${selected.has(order.id) ? "ring-2 ring-primary/50" : ""}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {order.status === "placed" && (
                    <Checkbox
                      checked={selected.has(order.id)}
                      onCheckedChange={() => toggleSelect(order.id)}
                      className="mt-0.5"
                    />
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Order {order.id.slice(0, 8)}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                  </div>
                </div>
                <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{order.quantity} cans</span>
                {order.delivery_address && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{order.delivery_address}</span>
                )}
                <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
              </div>
              <div className="flex gap-2">
                {order.status === "placed" && (
                  <>
                    <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => updateStatus(order.id, "confirmed")}><Check className="h-3.5 w-3.5" /> Accept</Button>
                    <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl" onClick={() => updateStatus(order.id, "cancelled")}><X className="h-3.5 w-3.5" /> Reject</Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button size="sm" className="gap-1.5 rounded-xl" onClick={() => updateStatus(order.id, "out_for_delivery")}><Truck className="h-3.5 w-3.5" /> Dispatch</Button>
                )}
                {order.status === "out_for_delivery" && (
                  <Button size="sm" variant="outline" className="gap-1.5 rounded-xl" onClick={() => updateStatus(order.id, "delivered")}><Check className="h-3.5 w-3.5" /> Mark Delivered</Button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
