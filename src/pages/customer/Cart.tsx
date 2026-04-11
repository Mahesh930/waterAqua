import { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Package, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/use-cart";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const categoryIcons: Record<string, string> = {
  bottle: "🍶",
  can: "🪣",
  jar: "🫙",
  tanker: "🚛",
};

export default function Cart() {
  const { items, isLoading, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    setPlacing(true);

    // Group items by supplier
    const grouped: Record<string, typeof items> = {};
    items.forEach(ci => {
      const sid = ci.supplier_id;
      if (!grouped[sid]) grouped[sid] = [];
      grouped[sid].push(ci);
    });

    let success = true;
    for (const [supplierId, group] of Object.entries(grouped)) {
      const totalAmount = group.reduce((s, ci) => s + (ci.product?.price ?? 0) * ci.quantity, 0);
      const totalQty = group.reduce((s, ci) => s + ci.quantity, 0);
      const { error } = await supabase.from("orders").insert({
        customer_id: user.id,
        supplier_id: supplierId,
        quantity: totalQty,
        total_amount: totalAmount,
        delivery_address: "",
      } as any);
      if (error) { success = false; break; }
    }

    if (success) {
      await clearCart.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      toast({ title: "Order Placed! 🎉", description: `${Object.keys(grouped).length} order(s) created.` });
      navigate("/customer/track");
    } else {
      toast({ title: "Checkout failed", variant: "destructive" });
    }
    setPlacing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <ShoppingCart className="h-7 w-7 text-primary" /> Your Cart
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalItems} item{totalItems !== 1 ? "s" : ""} · ₹{totalPrice.toLocaleString()}
          </p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => clearCart.mutate()}>
            <Trash2 className="h-4 w-4 mr-1" /> Clear
          </Button>
        )}
      </motion.div>

      {items.length === 0 ? (
        <motion.div variants={item} className="glass-card rounded-2xl p-12 text-center">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Cart is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-4">Browse products and add them to your cart</p>
          <Button onClick={() => navigate("/customer/suppliers")} className="rounded-xl">
            Browse Products
          </Button>
        </motion.div>
      ) : (
        <>
          <AnimatePresence>
            {items.map(ci => (
              <motion.div key={ci.id} variants={item} layout exit={{ opacity: 0, x: -100 }}
                className="glass-card rounded-2xl p-4 flex items-center gap-4">
                <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl shrink-0">
                  {categoryIcons[ci.product?.category || "can"] || "🪣"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{ci.product?.name}</p>
                  <p className="text-xs text-muted-foreground">{ci.product?.size_liters}L · {ci.product?.suppliers?.business_name}</p>
                  <p className="text-sm font-bold text-primary mt-0.5">₹{(ci.product?.price ?? 0) * ci.quantity}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                    onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity - 1 })}>
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <span className="w-8 text-center font-bold">{ci.quantity}</span>
                  <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg"
                    onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity + 1 })}>
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Summary */}
          <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-semibold">₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Delivery</span>
              <span className="text-success font-semibold">FREE</span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-heading font-bold">Total</span>
              <span className="font-heading font-bold text-xl text-primary">₹{totalPrice.toLocaleString()}</span>
            </div>
            <Button className="w-full rounded-xl h-12 text-base font-semibold gap-2" size="lg"
              disabled={placing} onClick={handleCheckout}>
              {placing ? "Placing Order..." : <>Place Order <ArrowRight className="h-4 w-4" /></>}
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
