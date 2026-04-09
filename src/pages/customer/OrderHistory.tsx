import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Package, Droplets, Star, Send } from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

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
      order_id: orderId,
      supplier_id: supplierId,
      customer_id: customerId,
      rating,
      comment: comment.trim() || null,
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
    <div className="mt-3 p-4 rounded-xl bg-muted/30 space-y-3">
      <p className="text-sm font-medium">Rate this delivery</p>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button key={star} type="button"
            onMouseEnter={() => setHover(star)} onMouseLeave={() => setHover(0)}
            onClick={() => setRating(star)}>
            <Star className={`h-6 w-6 transition-colors ${
              star <= (hover || rating) ? "fill-warning text-warning" : "text-muted-foreground/30"
            }`} />
          </button>
        ))}
      </div>
      <Textarea placeholder="Share your experience (optional)..." value={comment}
        onChange={e => setComment(e.target.value)} className="rounded-xl resize-none" rows={2} />
      <Button size="sm" className="gap-2 rounded-xl" onClick={submit} disabled={loading}>
        <Send className="h-3.5 w-3.5" /> {loading ? "Submitting..." : "Submit Review"}
      </Button>
    </div>
  );
}

export default function OrderHistory() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: orders = [], isLoading } = useQuery({
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

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["my-feedbacks", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("order_id, rating, comment")
        .eq("customer_id", user!.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const feedbackByOrder = new Map(feedbacks.map(f => [f.order_id, f]));

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Order History</h2>
        <p className="text-muted-foreground">View all your past and current tanker orders.</p>
      </motion.div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No orders yet</p>
          <p className="text-sm mt-1">Browse suppliers to place your first tanker order!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order, i) => {
            const existingFeedback = feedbackByOrder.get(order.id);
            return (
              <motion.div key={order.id}
                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Droplets className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{order.suppliers?.business_name ?? "Unknown"}</span>
                        <span className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">Order {order.id.slice(0, 8)}</p>
                    </div>
                  </div>
                  <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground ml-13">
                  <span>{order.quantity} cans</span>
                  <span>·</span>
                  <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>

                {/* Review section */}
                {order.status === "delivered" && !existingFeedback && (
                  <RatingWidget
                    orderId={order.id}
                    supplierId={order.supplier_id}
                    customerId={user!.id}
                    onDone={() => queryClient.invalidateQueries({ queryKey: ["my-feedbacks"] })}
                  />
                )}
                {existingFeedback && (
                  <div className="mt-3 p-3 rounded-xl bg-muted/30 flex items-center gap-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map(s => (
                        <Star key={s} className={`h-3.5 w-3.5 ${s <= existingFeedback.rating ? "fill-warning text-warning" : "text-muted-foreground/30"}`} />
                      ))}
                    </div>
                    {existingFeedback.comment && <span className="text-xs text-muted-foreground ml-2">{existingFeedback.comment}</span>}
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
