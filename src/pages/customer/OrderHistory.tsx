import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Droplets, Star, Send, Printer, ChevronDown, ChevronUp, MapPin, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

const statusColors: Record<string, string> = {
  delivered: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
  cancelled: "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400",
};

const statusLabels: Record<string, string> = {
  delivered: "Delivered",
  cancelled: "Cancelled",
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
      toast({ title: "Thank you!", description: "Your feedback has been submitted." });
      onDone();
    }
    setLoading(false);
  };

  return (
    <div className="mt-3 p-4 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 space-y-3">
      <p className="text-sm font-medium">Rate your delivery</p>
      <div className="flex gap-1.5">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button" onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)} onClick={() => setRating(star)}
            className="transition-transform hover:scale-110">
            <Star className={`h-6 w-6 transition-colors ${star <= (hover || rating) ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
          </button>
        ))}
      </div>
      <Textarea placeholder="How was the delivery? (optional)" value={comment}
        onChange={e => setComment(e.target.value)} className="rounded-lg resize-none text-sm" rows={2} />
      <Button size="sm" className="gap-1.5 rounded-lg" onClick={submit} disabled={loading}>
        <Send className="h-3.5 w-3.5" /> {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
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
      <h1>AquaHome Receipt</h1>
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
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-border" onClick={e => e.stopPropagation()}>
        <div className="text-center">
          <Printer className="h-8 w-8 mx-auto text-primary mb-2" />
          <h3 className="font-semibold text-lg">Payment Receipt</h3>
        </div>
        <div className="space-y-2 text-sm bg-muted/50 rounded-lg p-4">
          <div className="flex justify-between"><span className="text-muted-foreground">Order</span><span className="font-mono text-xs">#{order.id.slice(0, 8)}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Supplier</span><span className="font-medium">{order.suppliers?.business_name ?? "N/A"}</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Quantity</span><span>{order.quantity} units</span></div>
          <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span>{new Date(order.created_at).toLocaleDateString("en-IN")}</span></div>
          <div className="flex justify-between border-t border-border pt-2 font-semibold text-base">
            <span>Total</span><span className="text-primary">₹{Number(order.total_amount)}</span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button className="flex-1 gap-2 rounded-lg" onClick={printReceipt}>
            <Printer className="h-4 w-4" /> Print / Download
          </Button>
          <Button variant="outline" className="rounded-lg" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}

export default function OrderHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [receiptOrder, setReceiptOrder] = useState<any>(null);
  const [filter, setFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Only fetch delivered and cancelled orders for history
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["customer-orders-history", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area)")
        .eq("customer_id", user!.id)
        .in("status", ["delivered", "cancelled"])
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("customer-orders-history-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => { 
          queryClient.invalidateQueries({ queryKey: ["customer-orders-history"] });
          queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
        }
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

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);
  const totalSpent = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0);
  const deliveredCount = orders.filter(o => o.status === "delivered").length;
  const cancelledCount = orders.filter(o => o.status === "cancelled").length;

  return (
    <div className="space-y-6 py-2">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold">Order History</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {orders.length} order{orders.length !== 1 ? "s" : ""} · ₹{totalSpent} total spent
        </p>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: "all", label: "All", count: orders.length },
          { key: "delivered", label: "Delivered", count: deliveredCount },
          { key: "cancelled", label: "Cancelled", count: cancelledCount },
        ].filter(f => f.count > 0 || f.key === "all").map(f => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
              filter === f.key ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"
            }`}>
            {f.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              filter === f.key ? "bg-white/20" : "bg-muted"
            }`}>{f.count}</span>
          </button>
        ))}
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Package className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-lg">No orders found</p>
          <p className="text-sm text-muted-foreground mt-1 mb-5">
            {filter === "all" ? "Your completed and cancelled orders will appear here." : "No orders with this status."}
          </p>
          <Link to="/customer/products">
            <Button className="rounded-lg gap-2">
              <Droplets className="h-4 w-4" /> Browse Products
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => {
            const existingFeedback = feedbackByOrder.get(order.id);
            const isExpanded = expandedId === order.id;
            const isCancelled = order.status === "cancelled";

            return (
              <div key={order.id}
                className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/20 transition-all">
                
                {/* Main row */}
                <div className="p-4 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : order.id)}>
                  <div className="flex items-center gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center text-lg shrink-0 ${
                      isCancelled ? "bg-red-50 dark:bg-red-900/10" : "bg-muted"
                    }`}>
                      {isCancelled ? "❌" : "💧"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{order.suppliers?.business_name ?? "Unknown"}</span>
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-medium ${statusColors[order.status]}`}>
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
                      <span className={`font-semibold ${isCancelled ? "text-muted-foreground line-through" : "text-primary"}`}>
                        ₹{Number(order.total_amount)}
                      </span>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t border-border">
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">Order Date</p>
                          <p className="font-medium">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>
                        <div className="bg-muted/50 rounded-lg p-2.5">
                          <p className="text-muted-foreground mb-0.5">Supplier Area</p>
                          <p className="font-medium flex items-center gap-1"><MapPin className="h-3 w-3" />{(order.suppliers as any)?.area ?? "N/A"}</p>
                        </div>
                      </div>

                      {isCancelled && (
                        <div className="flex items-center gap-2 text-xs bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/20 rounded-lg p-3">
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          <span className="text-red-600 dark:text-red-400 font-medium">This order was cancelled</span>
                        </div>
                      )}
                      
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/30 rounded-lg p-2.5">
                          <MapPin className="h-3 w-3 mt-0.5 text-primary shrink-0" />
                          <span>{order.delivery_address}</span>
                        </div>
                      )}

                      {order.status === "delivered" && (
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" className="gap-1.5 rounded-lg text-xs h-8" onClick={() => setReceiptOrder(order)}>
                            <Printer className="h-3 w-3" /> Receipt
                          </Button>
                        </div>
                      )}

                      {order.status === "delivered" && !existingFeedback && (
                        <RatingWidget orderId={order.id} supplierId={order.supplier_id} customerId={user!.id}
                          onDone={() => queryClient.invalidateQueries({ queryKey: ["my-feedbacks"] })} />
                      )}
                      {existingFeedback && (
                        <div className="p-3 rounded-lg bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 flex items-center gap-2">
                          <div className="flex">
                            {[1, 2, 3, 4, 5].map(s => (
                              <Star key={s} className={`h-4 w-4 ${s <= existingFeedback.rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground/20"}`} />
                            ))}
                          </div>
                          {existingFeedback.comment && <span className="text-xs text-muted-foreground ml-2 truncate">{existingFeedback.comment}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {receiptOrder && <ReceiptModal order={receiptOrder} onClose={() => setReceiptOrder(null)} />}
    </div>
  );
}
