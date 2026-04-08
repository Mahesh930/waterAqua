import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Minus, Plus, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";

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
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Place Order</h2>
        <p className="text-muted-foreground text-sm">Select a supplier and quantity to order.</p>
      </div>

      <form onSubmit={handleOrder} className="space-y-5">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Supplier</CardTitle></CardHeader>
          <CardContent>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger><SelectValue placeholder="Select a supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.business_name} — ₹{Number(s.price_per_can)}/can</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Quantity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(supplier?.min_order || 1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="text-2xl font-heading font-bold w-12 text-center">{quantity}</span>
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">cans</span>
            </div>
            {supplier && <p className="text-xs text-muted-foreground mt-2">Min order: {supplier.min_order} can(s)</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Delivery Address</CardTitle></CardHeader>
          <CardContent>
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Enter your delivery address" className="pl-10" value={address} onChange={e => setAddress(e.target.value)} required />
            </div>
          </CardContent>
        </Card>

        {supplier && (
          <Card className="border-primary/30 bg-primary/5">
            <CardContent className="p-5">
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-sm text-muted-foreground">Order Summary</p>
                  <p className="font-medium">{quantity} × ₹{Number(supplier.price_per_can)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-heading font-bold text-primary">₹{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={!supplierId || !address || loading}>
          {loading ? "Placing order..." : `Place Order — ₹${total}`}
        </Button>
      </form>
    </div>
  );
}
