import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Minus, Plus, MapPin, Droplets, ShoppingCart, Truck, Navigation, Package, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";

type OrderType = "can" | "tanker";

export default function PlaceOrder() {
  const [params] = useSearchParams();
  const preselected = params.get("supplier") || "";
  const preType = (params.get("type") as OrderType) || "can";

  const [supplierId, setSupplierId] = useState(preselected);
  const [orderType, setOrderType] = useState<OrderType>(preType);
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1: select, 2: details, 3: confirm
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();

  const { data: suppliers = [] } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("available", true)
        .eq("blocked", false)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const supplier = suppliers.find(s => s.id === supplierId);
  const unitPrice = supplier
    ? orderType === "tanker"
      ? Number((supplier as any).price_per_tanker || 500)
      : Number(supplier.price_per_can)
    : 0;
  const total = unitPrice * quantity;

  // Auto-lookup pincode
  useEffect(() => {
    if (pincode.length === 6) {
      lookup(pincode);
    }
  }, [pincode, lookup]);

  // Auto-fill address from pincode data
  useEffect(() => {
    if (pincodeData && !address) {
      setAddress(`${pincodeData.area}, ${pincodeData.city}, ${pincodeData.district}, ${pincodeData.state} - ${pincodeData.pincode}`);
    }
  }, [pincodeData]);

  // If preselected supplier, skip to step 2
  useEffect(() => {
    if (preselected && suppliers.find(s => s.id === preselected)) {
      setStep(2);
    }
  }, [preselected, suppliers]);

  const handleOrder = async () => {
    if (!user || !supplier) return;
    setLoading(true);

    const { error } = await supabase.from("orders").insert({
      customer_id: user.id,
      supplier_id: supplier.id,
      quantity,
      total_amount: total,
      delivery_address: address,
      pincode: pincode || null,
    } as any);

    if (error) {
      toast({ title: "Order failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Order Placed! 🎉", description: `${quantity} ${orderType === "tanker" ? "tanker(s)" : "can(s)"} from ${supplier.business_name}. Total: ₹${total}` });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      navigate("/customer/history");
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Order Water</h2>
        <p className="text-muted-foreground">Choose your delivery type and place your order.</p>
      </motion.div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { n: 1, label: "Select" },
          { n: 2, label: "Details" },
          { n: 3, label: "Confirm" },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
              step >= s.n ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}>
              {step > s.n ? <CheckCircle2 className="h-4 w-4" /> : s.n}
            </div>
            <span className={`hidden sm:inline ${step >= s.n ? "text-foreground font-medium" : "text-muted-foreground"}`}>{s.label}</span>
            {i < 2 && <div className={`h-px w-8 ${step > s.n ? "bg-primary" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      {/* Step 1: Select Supplier & Type */}
      {step === 1 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <Label className="font-heading font-semibold">Order Type</Label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setOrderType("can")}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  orderType === "can" ? "border-primary bg-primary/5" : "border-transparent glass"
                }`}>
                <ShoppingCart className={`h-8 w-8 mx-auto mb-2 ${orderType === "can" ? "text-primary" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm">Water Cans</p>
                <p className="text-xs text-muted-foreground mt-1">20L cans delivered</p>
              </button>
              <button
                onClick={() => setOrderType("tanker")}
                className={`p-4 rounded-xl border-2 transition-all text-center ${
                  orderType === "tanker" ? "border-accent bg-accent/5" : "border-transparent glass"
                }`}>
                <Truck className={`h-8 w-8 mx-auto mb-2 ${orderType === "tanker" ? "text-accent" : "text-muted-foreground"}`} />
                <p className="font-medium text-sm">Full Tanker</p>
                <p className="text-xs text-muted-foreground mt-1">Bulk water delivery</p>
              </button>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <Label className="font-heading font-semibold">Select Supplier</Label>
            <Select value={supplierId} onValueChange={setSupplierId}>
              <SelectTrigger className="rounded-xl"><SelectValue placeholder="Choose a supplier" /></SelectTrigger>
              <SelectContent>
                {suppliers.map(s => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.business_name} — ₹{orderType === "tanker" ? Number((s as any).price_per_tanker || 500) : Number(s.price_per_can)}/{orderType} · {s.area}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {supplier && (
              <div className="rounded-xl bg-muted/30 p-3 flex items-center justify-between">
                <div className="text-sm">
                  <p className="font-medium">{supplier.business_name}</p>
                  <p className="text-xs text-muted-foreground">{supplier.area} · {supplier.water_type}</p>
                </div>
                <span className="font-heading font-bold text-primary">₹{unitPrice}<span className="text-xs font-normal text-muted-foreground">/{orderType}</span></span>
              </div>
            )}
          </div>

          <Button className="w-full rounded-xl" size="lg" disabled={!supplierId} onClick={() => setStep(2)}>
            Continue →
          </Button>
        </motion.div>
      )}

      {/* Step 2: Quantity & Address */}
      {step === 2 && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <Label className="font-heading font-semibold">Quantity ({orderType === "tanker" ? "Tankers" : "Cans"})</Label>
            <div className="flex items-center gap-4">
              <Button type="button" variant="outline" size="icon" className="rounded-xl h-12 w-12" onClick={() => setQuantity(Math.max(supplier?.min_order || 1, quantity - 1))}><Minus className="h-5 w-5" /></Button>
              <span className="text-4xl font-heading font-bold w-16 text-center">{quantity}</span>
              <Button type="button" variant="outline" size="icon" className="rounded-xl h-12 w-12" onClick={() => setQuantity(quantity + 1)}><Plus className="h-5 w-5" /></Button>
            </div>
            {supplier && orderType === "can" && <p className="text-xs text-muted-foreground">Min order: {supplier.min_order} can(s) · Stock: {supplier.stock}</p>}
            {supplier && orderType === "tanker" && <p className="text-xs text-muted-foreground">Capacity: {(supplier as any).tanker_capacity || 5000}L per tanker</p>}
          </div>

          <div className="glass-card rounded-2xl p-5 space-y-4">
            <Label className="font-heading font-semibold">Delivery Location</Label>
            <div className="relative">
              <Navigation className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Enter Pincode" 
                value={pincode} 
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                  setPincode(v);
                }} 
                className="pl-10 rounded-xl" 
                maxLength={6}
              />
            </div>
            {pincodeLoading && <p className="text-xs text-muted-foreground animate-pulse">Looking up pincode...</p>}
            {pincodeData && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3 w-3 text-primary" />
                {pincodeData.area}, {pincodeData.city}, {pincodeData.district}, {pincodeData.state}
              </div>
            )}
            <div className="relative">
              <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Full delivery address" className="pl-10 rounded-xl" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl glass" onClick={() => setStep(1)}>← Back</Button>
            <Button className="flex-1 rounded-xl" size="lg" disabled={!address} onClick={() => setStep(3)}>Review Order →</Button>
          </div>
        </motion.div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && supplier && (
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-heading font-semibold flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Order Summary</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Supplier</span>
                <span className="font-medium">{supplier.business_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Type</span>
                <span className="font-medium capitalize">{orderType === "tanker" ? "Full Tanker" : "Water Cans"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Quantity</span>
                <span className="font-medium">{quantity} {orderType === "tanker" ? "tanker(s)" : "can(s)"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Unit Price</span>
                <span className="font-medium">₹{unitPrice}</span>
              </div>
              {(supplier as any).driver_phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Driver Phone</span>
                  <span className="font-medium">{(supplier as any).driver_phone}</span>
                </div>
              )}
              {(supplier as any).vehicle_number && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vehicle</span>
                  <span className="font-medium">{(supplier as any).vehicle_number}</span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Delivery Address</span>
                <span className="font-medium text-right max-w-[60%]">{address}</span>
              </div>
              {pincode && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pincode</span>
                  <span className="font-medium">{pincode}</span>
                </div>
              )}
              <div className="h-px bg-border" />
              <div className="flex justify-between items-center">
                <span className="font-heading font-semibold text-base">Total</span>
                <span className="text-3xl font-heading font-bold text-primary">₹{total}</span>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-gradient-to-r from-primary/10 to-accent/10 p-4 border border-primary/20 text-center">
            <Droplets className="h-6 w-6 mx-auto text-primary mb-2" />
            <p className="text-sm font-medium">Estimated Delivery: {supplier.delivery_time}</p>
            <p className="text-xs text-muted-foreground mt-1">You'll receive notifications for order updates</p>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" className="rounded-xl glass" onClick={() => setStep(2)}>← Back</Button>
            <Button className="flex-1 rounded-xl" size="lg" disabled={loading} onClick={handleOrder}>
              {loading ? "Placing order..." : `Place Order — ₹${total}`}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
