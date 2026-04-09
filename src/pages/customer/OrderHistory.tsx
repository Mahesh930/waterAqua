import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Droplets, Star, Send, XCircle, Printer, Clock, ChevronDown, ChevronUp, MapPin, Filter } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  out_for_delivery: "On the Way",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const statusEmoji: Record<string, string> = {
  placed: "📦", confirmed: "✅", out_for_delivery: "🚛", delivered: "💧", cancelled: "❌",
};

function RatingWidget({ orderId, supplierId, customerId, onDone }: {
  orderId: string; supplierId: string; customerId: string; onDone: () => void;
}) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const submit = async () => {
    if (rating === 0) { toast({ title: "Please select a rating", variant: "destructive" }); return; }
    setLoading(true);
    const { error } = await supabase.from("feedback").insert({
      order_id: orderId, supplier_id: supplierId, customer_id: customerId,
      rating, comment: comment.trim() || null,
    });
    if (error) {
      toast({ title: "Failed to submit", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Thank you! ⭐", description: "Your feedback has been submitted." });
      onDone();
    }
    setLoading(false);
  };

  return (
    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
      className="mt-3 p-4 rounded-xl bg-gradient-to-br from-warning/5 to-transparent border border-warning/10 space-y-3">
      <p className="text-sm font-heading font-semibold">Rate your delivery ⭐</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)}
            className="transition-transform hover:scale-125">
            <Star className={`h-7 w-7 transition-colors ${star <= (hover || rating) ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
          </button>
        ))}
      </div>
      <Textarea placeholder="How was the delivery experience? (optional)" value={comment}
        onChange={e => setComment(e.target.value)} className="rounded-xl resize-none bg-card/50 border-border/50" rows={2} />
      <Button size="sm" className="gap-2 rounded-xl shadow-md" onClick={submit} disabled={loading}>
        <Send className="h-3.5 w-3.5" /> {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </motion.div>
  );
}

function ReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
  const printReceipt = () => {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`
      <html><head><title>Receipt - ${order.id.slice(0, 8)}</title>
      <style>body{font-family:system-ui;max-width:400px;margin:40px auto;padding:20px}
      h1{font-size:20px;text-align:center}
      .line{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #eee}
      .total{font-size:18px;font-weight:bold;border-top:2px solid #333;margin-top:8px;padding-top:12px}
      .footer{text-align:center;color:#888;font-size:12px;margin-top:24px}
      </style></head><body>
      <h1>🚰 AquaHome Receipt</h1>
      <p style="text-align:center;color:#666">Order #${order.id.slice(0, 8)}</p>
      <div class="line"><span>Supplier</span><span>${order.suppliers?.business_name ?? "N/A"}</span></div>
      <div class="line"><span>Quantity</span><span>${order.quantity} cans</span></div>
      <div class="line"><span>Date</span><span>${new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span></div>
      <div class="line"><span>Status</span><span>${order.status}</span></div>
      ${order.delivery_address ? `<div class="line"><span>Address</span><span>${order.delivery_address}</span></div>` : ""}
      <div class="line total"><span>Total Amount</span><span>₹${Number(order.total_amount)}</span></div>
      <div class="footer"><p>Thank you for choosing AquaHome!</p></div>
      </body></html>
    `);
    w.document.close();
    w.print();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
        className="bg-card rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-border" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <div className="h-12 w-12 mx-auto mb-2 rounded-xl bg-primary/10 flex items-center justify-center">
            <Printer className="h-6 w-6 text-primary" />
          </div>
          <h3 className="font-heading font-bold text-lg">Payment Receipt</h3>
        </div>
        <div className="space-y-2.5 text-sm bg-muted/30 rounded-xl p-4">
          <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono text-xs">#{order.id.slice(0, 8)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span className="font-medium">{order.suppliers?.business_name ?? "N/A"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{order.quantity} units</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span></div>
          <div className="flex justify-between border-t border-border pt-2 font-bold text-base">
            <span>Total</span><span className="text-primary">₹{Number(order.total_amount)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2 rounded-xl shadow-md" onClick={printReceipt}>
            <Printer className="h-4 w-4" /> Print / Download
          </Button>
          <Button variant="outline" className="rounded-xl" onClick={onClose}>Close</Button>
        </div>
      </motion.div>
    </div>
  );
}

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function OrderHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area)")
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
      .channel("customer-orders-realtime")
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["customer-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["my-feedbacks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback").select("order_id, rating, comment").eq("customer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const feedbackByOrder = new Map(feedbacks.map(f => [f.order_id, f]));

  const cancelOrder = async (orderId: string) => {
    const { error } = await supabase.from("orders").update({ status: "cancelled" as any }).eq("id", orderId).eq("customer_id", user!.id);
    if (error) { toast({ title: "Cancel failed", description: error.message, variant: "destructive" }); }
    else { toast({ title: "Order Cancelled" }); queryClient.invalidateQueries({ queryKey: ["customer-orders"] }); }
  };

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalSpent = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Order History</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {orders.length} order{orders.length !== 1 ? "s" : ""} · ₹{totalSpent} total spent
          </p>
        </div>
      </motion.div>

      {/* Filter pills */}
      <motion.div variants={item} className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All", count: orders.length },
          { key: "placed", label: "📦 Placed", count: orders.filter(o => o.status === "placed").length },
          { key: "confirmed", label: "✅ Confirmed", count: orders.filter(o => o.status === "confirmed").length },
          { key: "out_for_delivery", label: "🚛 Delivering", count: orders.filter(o => o.status === "out_for_delivery").length },
          { key: "delivered", label: "💧 Delivered", count: orders.filter(o => o.status === "delivered").length },
          { key: "cancelled", label: "❌ Cancelled", count: orders.filter(o => o.status === "cancelled").length },
        ].filter(f => f.count > 0 || f.key === "all").map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
              filter === f.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-md ${
              filter === f.key ? "bg-white/20" : "bg-muted"
            }`}>{f.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Orders */}
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
          <p className="font-heading font-bold text-lg">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "all" ? "Browse suppliers to place your first order!" : "No orders with this status."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => {
            const existingFeedback = feedbackByOrder.get(order.id);
            const canCancel = order.status === "placed" || order.status === "confirmed";
            const isExpanded = expandedId === order.id;

            return (
              <motion.div key={order.id} variants={item}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-all ring-1 ring-border/30">
                
                {/* Main row */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-lg shrink-0">
                      {statusEmoji[order.status]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-heading font-semibold text-sm">{order.suppliers?.business_name ?? "Unknown"}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span className="font-mono">#{order.id.slice(0, 6)}</span>
                        <span>·</span>
                        <span>{order.quantity} units</span>
                        <span>·</span>
                        <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-border/30">
                      <div className="p-4 space-y-3">
                        {/* Order details */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <p className="text-muted-foreground mb-0.5">Order Date</p>
                            <p className="font-medium">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                          </div>
                          <div className="bg-muted/30 rounded-lg p-2.5">
                            <p className="text-muted-foreground mb-0.5">Supplier Area</p>
                            <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{(order.suppliers as any)?.area ?? "N/A"}</p>
                          </div>
                        </div>
                        
                        {order.delivery_address && (
                          <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/20 rounded-lg p-2.5">
                            <MapPin className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                            <span>{order.delivery_address}</span>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex gap-2 flex-wrap">
                          {canCancel && (
                            <Button size="sm" variant="destructive" className="gap-1.5 rounded-xl text-xs h-8" onClick={() => cancelOrder(order.id)}>
                              <XCircle className="h-3 w-3" /> Cancel
                            </Button>
                          )}
                          {order.status === "delivered" && (
                            <Button size="sm" variant="outline" className="gap-1.5 rounded-xl text-xs h-8 glass" onClick={() => setReceiptOrder(order)}>
                              <Printer className="h-3 w-3" /> Receipt
                            </Button>
                          )}
                        </div>

                        {/* Review */}
                        {order.status === "delivered" && !existingFeedback && (
                          <RatingWidget orderId={order.id} supplierId={order.supplier_id} customerId={user!.id}
                            onDone={() => queryClient.invalidateQueries({ queryKey: ["my-feedbacks"] })} />
                        )}
                        {existingFeedback && (
                          <div className="p-3 rounded-xl bg-warning/5 border border-warning/10 flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map(s => (
                                <Star key={s} className={`h-4 w-4 ${s <= existingFeedback.rating ? "fill-warning text-warning" : "text-muted-foreground/20"}`} />
                              ))}
                            </div>
                            {existingFeedback.comment && <span className="text-xs text-muted-foreground ml-2 truncate">{existingFeedback.comment}</span>}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}

      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </motion.div>
  );
}
