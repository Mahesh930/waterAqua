import { useState } from "react";
import { ShoppingCart, Minus, Plus, Trash2, ArrowRight, Droplets, MapPin, Phone, Truck, ShieldCheck, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useCart, type CartItem } from "@/hooks/use-cart";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const categoryIcons: Record<string, string> = {
  bottle: "🍶", can: "🪣", jar: "🫙", tanker: "🚛",
};

export default function Cart() {
  const { items, isLoading, updateQty, clearCart, totalItems, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [placing, setPlacing] = useState(false);
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");

  // Group items by supplier
  const grouped = items.reduce<Record<string, { supplier: any; items: CartItem[]; subtotal: number }>>((acc, ci) => {
    const sid = ci.supplier_id;
    if (!acc[sid]) acc[sid] = { supplier: ci.product?.suppliers, items: [], subtotal: 0 };
    acc[sid].items.push(ci);
    acc[sid].subtotal += (ci.product?.price ?? 0) * ci.quantity;
    return acc;
  }, {});

  const handleCheckout = async () => {
    if (!user || items.length === 0) return;
    if (!address.trim() || address.trim().length < 8) {
      toast({ title: "Delivery address required", description: "Please enter a complete address.", variant: "destructive" });
      return;
    }
    if (pincode && pincode.length !== 6) {
      toast({ title: "Invalid pincode", variant: "destructive" });
      return;
    }
    setPlacing(true);

    let success = true;
    let placedCount = 0;
    for (const [supplierId, group] of Object.entries(grouped)) {
      const totalQty = group.items.reduce((s, ci) => s + ci.quantity, 0);
      const { error } = await supabase.from("orders").insert({
        customer_id: user.id,
        supplier_id: supplierId,
        quantity: totalQty,
        total_amount: group.subtotal,
        delivery_address: address.trim() + (phone ? ` · ${phone}` : ""),
        pincode: pincode || null,
      } as any);
      if (error) { success = false; break; }
      placedCount++;
    }

    if (success) {
      await clearCart.mutateAsync();
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      toast({ title: "🎉 Order Placed!", description: `${placedCount} order${placedCount > 1 ? "s" : ""} created successfully.` });
      navigate("/customer/track");
    } else {
      toast({ title: "Checkout failed", description: "Please try again.", variant: "destructive" });
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
    <motion.div variants={container} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-6">
      {/* Hero */}
      <motion.div variants={item} className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-accent p-6 text-primary-foreground">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-32 w-32 rounded-full bg-accent/40 blur-3xl" />
        </div>
        <div className="relative flex items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-2">
              <ShoppingCart className="h-3 w-3" /> Your Cart
            </div>
            <h2 className="font-heading text-2xl sm:text-3xl font-bold">
              {totalItems > 0 ? `${totalItems} item${totalItems !== 1 ? "s" : ""} ready` : "Cart is empty"}
            </h2>
            <p className="text-sm text-white/85 mt-1">
              {Object.keys(grouped).length > 0 && `From ${Object.keys(grouped).length} supplier${Object.keys(grouped).length > 1 ? "s" : ""}`}
            </p>
          </div>
          {totalItems > 0 && (
            <div className="hidden sm:block bg-white/15 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-right">
              <p className="text-[10px] text-white/70 font-semibold uppercase tracking-wider">Total</p>
              <p className="text-2xl font-heading font-bold">₹{totalPrice.toLocaleString()}</p>
            </div>
          )}
        </div>
      </motion.div>

      {items.length === 0 ? (
        <motion.div variants={item} className="glass-card rounded-3xl p-12 text-center">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Your cart is empty</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-5">Browse our fresh water products and add them to your cart</p>
          <Button onClick={() => navigate("/customer/products")} className="rounded-xl gap-2 shadow-lg shadow-primary/20">
            Browse Products <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_360px] gap-6">
          {/* LEFT: items grouped by supplier */}
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-bold text-lg">Items</h3>
              <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 rounded-xl"
                onClick={() => clearCart.mutate()}>
                <Trash2 className="h-4 w-4 mr-1" /> Clear all
              </Button>
            </div>

            <AnimatePresence mode="popLayout">
              {Object.entries(grouped).map(([sid, g]) => (
                <motion.div key={sid} variants={item} layout
                  className="glass-card rounded-2xl overflow-hidden ring-1 ring-border/30">
                  {/* Supplier header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-primary/8 to-transparent border-b border-border/30 flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="h-9 w-9 rounded-xl bg-card shadow-sm border border-border/40 flex items-center justify-center text-base shrink-0">
                        🏪
                      </div>
                      <div className="min-w-0">
                        <p className="font-heading font-bold text-sm truncate">{g.supplier?.business_name ?? "Supplier"}</p>
                        <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                          <MapPin className="h-2.5 w-2.5" />{g.supplier?.area ?? "—"}
                        </p>
                      </div>
                    </div>
                    <Badge className="bg-primary/10 text-primary border-0 text-xs font-bold shrink-0">₹{g.subtotal}</Badge>
                  </div>
                  {/* Items */}
                  <div className="divide-y divide-border/30">
                    {g.items.map(ci => (
                      <motion.div key={ci.id} layout exit={{ opacity: 0, x: -50 }}
                        className="flex items-center gap-3 p-4 hover:bg-muted/20 transition-colors">
                        <div className="h-14 w-14 rounded-xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center text-2xl shrink-0">
                          {ci.product?.image_url ? (
                            <img src={ci.product.image_url} alt={ci.product.name} className="h-full w-full object-contain rounded-xl p-1" />
                          ) : (categoryIcons[ci.product?.category || "can"] || "🪣")}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-heading font-semibold text-sm truncate">{ci.product?.name}</p>
                          <p className="text-[11px] text-muted-foreground">{ci.product?.size_liters}L · ₹{ci.product?.price} each</p>
                          <p className="text-sm font-bold text-primary mt-0.5">₹{(ci.product?.price ?? 0) * ci.quantity}</p>
                        </div>
                        <div className="flex items-center gap-1.5 bg-muted/40 rounded-xl p-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-card"
                            onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity - 1 })}>
                            <Minus className="h-3 w-3" />
                          </Button>
                          <span className="w-7 text-center font-bold text-sm">{ci.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:bg-card"
                            onClick={() => updateQty.mutate({ itemId: ci.id, quantity: ci.quantity + 1 })}>
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Delivery details */}
            <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-primary" />
                </div>
                <h3 className="font-heading font-bold">Delivery Details</h3>
              </div>
              <div className="space-y-3">
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Textarea placeholder="Full delivery address (house, street, landmark, area)"
                    value={address} onChange={e => setAddress(e.target.value)}
                    className="pl-10 rounded-xl bg-muted/30 border-border/50 resize-none" rows={3} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="relative">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Pincode" value={pincode} maxLength={6}
                      onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      className="pl-10 rounded-xl bg-muted/30 border-border/50" />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Phone (optional)" value={phone}
                      onChange={e => setPhone(e.target.value)}
                      className="pl-10 rounded-xl bg-muted/30 border-border/50" />
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* RIGHT: sticky summary */}
          <motion.div variants={item} className="lg:sticky lg:top-4 h-fit space-y-4">
            <div className="glass-card rounded-2xl p-5 space-y-4 ring-1 ring-primary/10">
              <h3 className="font-heading font-bold text-lg">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal ({totalItems} items)</span>
                  <span className="font-semibold">₹{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="text-success font-bold">FREE</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Suppliers</span>
                  <span className="font-semibold">{Object.keys(grouped).length}</span>
                </div>
              </div>
              <div className="border-t border-dashed border-border pt-3 flex justify-between items-end">
                <span className="font-heading font-bold">Total</span>
                <div className="text-right">
                  <p className="font-heading font-bold text-2xl text-primary leading-none">₹{totalPrice.toLocaleString()}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Inclusive of all taxes</p>
                </div>
              </div>
              <Button className="w-full rounded-xl h-12 text-base font-bold gap-2 shadow-lg shadow-primary/20"
                size="lg" disabled={placing} onClick={handleCheckout}>
                {placing ? "Placing Order..." : <>Place Order <ArrowRight className="h-4 w-4" /></>}
              </Button>
              <div className="flex items-center justify-center gap-2 text-[11px] text-muted-foreground pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-success" />
                <span>Secure checkout · Cancel anytime before delivery</span>
              </div>
            </div>

            {/* Trust badges */}
            <div className="grid grid-cols-3 gap-2">
              {[
                { icon: "💧", label: "Pure" },
                { icon: "⚡", label: "Fast" },
                { icon: "✅", label: "Verified" },
              ].map(b => (
                <div key={b.label} className="glass rounded-xl p-2 text-center">
                  <div className="text-lg">{b.icon}</div>
                  <p className="text-[10px] font-semibold text-muted-foreground">{b.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
