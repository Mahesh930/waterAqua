import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Minus, Plus, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { suppliers } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function PlaceOrder() {
  const [params] = useSearchParams();
  const preselected = params.get("supplier") || "";
  const [supplierId, setSupplierId] = useState(preselected);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const supplier = suppliers.find(s => s.id === supplierId);
  const total = supplier ? supplier.pricePerCan * quantity : 0;

  const handleOrder = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: "Order Placed! 🎉", description: `${quantity} cans from ${supplier?.name}. Total: ₹${total}` });
    navigate("/customer/history");
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
                {suppliers.filter(s => s.available).map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} — ₹{s.pricePerCan}/can</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Quantity</CardTitle></CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(Math.max(1, quantity - 1))}><Minus className="h-4 w-4" /></Button>
              <span className="text-2xl font-heading font-bold w-12 text-center">{quantity}</span>
              <Button type="button" variant="outline" size="icon" onClick={() => setQuantity(quantity + 1)}><Plus className="h-4 w-4" /></Button>
              <span className="text-sm text-muted-foreground">cans</span>
            </div>
            {supplier && <p className="text-xs text-muted-foreground mt-2">Min order: {supplier.minOrder} can(s)</p>}
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
                  <p className="font-medium">{quantity} × ₹{supplier.pricePerCan}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-heading font-bold text-primary">₹{total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Button type="submit" className="w-full" size="lg" disabled={!supplierId || !address}>
          Place Order — ₹{total}
        </Button>
      </form>
    </div>
  );
}
