import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Minus, Plus, MapPin, Droplets } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function PlaceOrder() {
  const [params] = useSearchParams();
  const preselected = params.get("supplier") || "";
  const [supplierId, setSupplierId] = useState(preselected);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("available", true)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const supplier = suppliers.find(s => s.id === supplierId);
  const total = supplier ? Number(supplier.price_per_can) * quantity : 0;

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !supplier) return;
    setLoading(true);

    const { error } = await supabase.from("orders").insert({
      customer_id: user.id,
      supplier_id: supplier.id,
      quantity,
      total_amount: total,
      delivery_address: address,
    });

    if (error) {
      toast({ title: "Order failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order Placed! 🎉", description: `${quantity} cans from ${supplier.business_name}. Total: ₹${total}` });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      navigate("/customer/history");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Order a Tanker</h2>
        <p className="text-muted-foreground">Select a supplier and quantity to place your order.</p>
      </motion.div>

      <form onSubmit={handleOrder} className="space-y-5">
        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Label className="font-heading font-semibold">Select Supplier</Label>
          <Select value={supplierId} onValueChange={setSupplierId}>
            <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a supplier" /></SelectTrigger>
            <SelectContent>
              {suppliers.map(s => (
                <SelectItem key={s.id} value={s.id}>
                  {s.business_name} — ₹{Number(s.price_per_can)}/can · {s.area}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Label className="font-heading font-semibold">Quantity (Cans)</Label>
          <div className="flex items-center gap-4">
            <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setQuantity(Math.max(supplier?.min_order || 1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
            <span className="text-3xl font-heading font-bold w-14 text-center">{quantity}</span>
            <Button type="button" variant="outline" size="icon" className="rounded-xl" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
            <span className="text-sm text-muted-foreground">cans</span>
          </div>
          {supplier && <p className="text-xs text-muted-foreground">Min order: {supplier.min_order} can(s) · Stock: {supplier.stock}</p>}
        </div>

        <div className="glass-card rounded-2xl p-5 space-y-4">
          <Label className="font-heading font-semibold">Delivery Address</Label>
          <div className="relative">
            <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Full delivery address with area & city" className="pl-10 rounded-xl" value={address} onChange={e => setAddress(e.target.value)} required />
          </div>
        </div>

        {supplier && (
          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-5 border border-primary/20">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground">Order Summary</p>
                <p className="font-medium">{quantity} × ₹{Number(supplier.price_per_can)}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-3xl font-heading font-bold text-primary">₹{total}</p>
              </div>
            </div>
          </div>
        )}

        <Button type="submit" className="w-full rounded-xl" size="lg" disabled={!supplierId || !address || loading}>
          {loading ? "Placing order..." : `Place Order — ₹${total}`}
        </Button>
      </form>
    </div>
  );
}
