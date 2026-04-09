import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  MapPin, Navigation, Droplets, Truck, ShoppingCart, Star, Clock, 
  ChevronRight, ChevronLeft, CheckCircle2, Phone, Package, Loader2,
  Minus, Plus, Info
} from "lucide-react";
import { estimateDeliveryTime } from "@/lib/delivery-estimate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";

type OrderType = "can" | "tanker";

const slideVariants = {
  enter: (d: number) => ({ x: d > 0 ? 300 : -300, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (d: number) => ({ x: d < 0 ? 300 : -300, opacity: 0 }),
};

export default function PlaceOrder() {
  const [params] = useSearchParams();
  const preselected = params.get("supplier") || "";
  const preType = (params.get("type") as OrderType) || "";

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1);
  const [pincode, setPincode] = useState("");
  const [address, setAddress] = useState("");
  const [orderType, setOrderType] = useState<OrderType | "">(preType);
  const [supplierId, setSupplierId] = useState(preselected);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lookup, data: pincodeData, loading: pincodeLoading, error: pincodeError } = usePincode();

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

  // Auto-lookup pincode
  useEffect(() => {
    if (pincode.length === 6) lookup(pincode);
  }, [pincode, lookup]);

  // Auto-fill address
  useEffect(() => {
    if (pincodeData) {
      setAddress(`${pincodeData.area}, ${pincodeData.city}, ${pincodeData.district}, ${pincodeData.state} - ${pincodeData.pincode}`);
    }
  }, [pincodeData]);

  // Skip to step 2 if preselected
  useEffect(() => {
    if (preselected && preType) {
      setStep(2);
      setOrderType(preType as OrderType);
      setSupplierId(preselected);
    }
  }, [preselected, preType]);

  // Matching suppliers for pincode
  // Strict pincode filtering: only show suppliers matching customer's pincode/area
  const matchedSuppliers = useMemo(() => {
    if (!pincodeData || pincode.length !== 6) return [];
    return suppliers.filter(s => {
      if (s.pincode === pincode) return true;
      const area = s.area.toLowerCase();
      return area.includes(pincodeData.city.toLowerCase()) || 
             area.includes(pincodeData.area.toLowerCase());
    });
  }, [suppliers, pincodeData, pincode]);

  const supplier = suppliers.find(s => s.id === supplierId);
  const unitPrice = supplier
    ? orderType === "tanker" ? Number((supplier as any).price_per_tanker || 500) : Number(supplier.price_per_can)
    : 0;
  const total = unitPrice * quantity;

  const goTo = (s: number) => {
    setDirection(s > step ? 1 : -1);
    setStep(s);
  };

  const handleOrder = async () => {
    if (!user || !supplier || !orderType) return;
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
      toast({ title: "Order Placed! 🎉", description: `Your ${orderType} order has been placed successfully.` });
      queryClient.invalidateQueries({ queryKey: ["customer-orders"] });
      navigate("/customer/track");
    }
    setLoading(false);
  };

  const steps = [
    { n: 1, label: "Location", icon: MapPin },
    { n: 2, label: "Vehicle", icon: Truck },
    { n: 3, label: "Supplier", icon: Star },
    { n: 4, label: "Confirm", icon: CheckCircle2 },
  ];

  return (
    <div className="max-w-lg mx-auto space-y-5">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-2xl font-bold">Book Water Delivery</h2>
      </motion.div>

      {/* Progress Bar — Porter style */}
      <div className="flex items-center gap-1">
        {steps.map((s, i) => (
          <div key={s.n} className="flex-1 flex items-center gap-1">
            <div className="flex-1 relative">
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: step >= s.n ? "100%" : "0%" }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
            {i < steps.length - 1 && <div className="w-1" />}
          </div>
        ))}
      </div>
      <div className="flex justify-between px-1">
        {steps.map(s => (
          <div key={s.n} className={`flex items-center gap-1 text-[10px] font-medium transition-colors ${step >= s.n ? "text-primary" : "text-muted-foreground"}`}>
            <s.icon className="h-3 w-3" />
            <span className="hidden sm:inline">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Steps Content */}
      <AnimatePresence mode="wait" custom={direction}>
        {/* Step 1: Location */}
        {step === 1 && (
          <motion.div key="step1" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}
            className="space-y-4">
            
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <div className="flex items-center gap-3 mb-1">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold">Where do you need water?</h3>
                  <p className="text-xs text-muted-foreground">Enter your delivery pincode</p>
                </div>
              </div>

              <div className="relative">
                <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
                <Input
                  placeholder="Enter 6-digit Pincode"
                  value={pincode}
                  onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="pl-10 rounded-xl text-lg h-12 font-medium"
                  maxLength={6}
                  autoFocus
                />
              </div>

              {pincodeLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Looking up pincode...
                </div>
              )}

              {pincodeError && (
                <p className="text-sm text-destructive">{pincodeError}</p>
              )}

              {pincodeData && (
                <motion.div initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl bg-primary/5 border border-primary/20 p-3">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm">{pincodeData.area}, {pincodeData.city}</p>
                      <p className="text-xs text-muted-foreground">{pincodeData.district}, {pincodeData.state}</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            <div className="glass-card rounded-2xl p-5 space-y-3">
              <Label className="text-sm font-medium">Full Delivery Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="House/Flat, Street, Landmark..."
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="pl-10 rounded-xl"
                />
              </div>
            </div>

            {pincodeData && (
              <div className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Info className="h-3.5 w-3.5" />
                {matchedSuppliers.length} supplier{matchedSuppliers.length !== 1 ? "s" : ""} available in your area
              </div>
            )}

            <Button className="w-full rounded-xl h-12 text-base" size="lg"
              disabled={!pincodeData || !address}
              onClick={() => goTo(2)}>
              Continue <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Vehicle Type */}
        {step === 2 && (
          <motion.div key="step2" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}
            className="space-y-4">
            
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-heading font-semibold mb-4">Choose delivery type</h3>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setOrderType("can")}
                  className={`relative p-5 rounded-2xl border-2 transition-all text-center group ${
                    orderType === "can" 
                      ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" 
                      : "border-transparent glass hover:border-muted-foreground/20"
                  }`}>
                  <div className={`h-16 w-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-colors ${
                    orderType === "can" ? "bg-primary/15" : "bg-muted/50"
                  }`}>
                    <ShoppingCart className={`h-8 w-8 ${orderType === "can" ? "text-primary" : "text-muted-foreground"}`} />
                  </div>
                  <p className="font-heading font-semibold">Water Cans</p>
                  <p className="text-xs text-muted-foreground mt-1">20L cans · Individual</p>
                  {orderType === "can" && (
                    <motion.div layoutId="selected-check"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
                    </motion.div>
                  )}
                </button>

                <button
                  onClick={() => setOrderType("tanker")}
                  className={`relative p-5 rounded-2xl border-2 transition-all text-center group ${
                    orderType === "tanker" 
                      ? "border-accent bg-accent/5 shadow-lg shadow-accent/10" 
                      : "border-transparent glass hover:border-muted-foreground/20"
                  }`}>
                  <div className={`h-16 w-16 mx-auto mb-3 rounded-2xl flex items-center justify-center transition-colors ${
                    orderType === "tanker" ? "bg-accent/15" : "bg-muted/50"
                  }`}>
                    <Truck className={`h-8 w-8 ${orderType === "tanker" ? "text-accent" : "text-muted-foreground"}`} />
                  </div>
                  <p className="font-heading font-semibold">Full Tanker</p>
                  <p className="text-xs text-muted-foreground mt-1">Bulk · 5000L+</p>
                  {orderType === "tanker" && (
                    <motion.div layoutId="selected-check"
                      className="absolute top-2 right-2 h-6 w-6 rounded-full bg-accent flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-accent-foreground" />
                    </motion.div>
                  )}
                </button>
              </div>
            </div>

            {orderType && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-2xl p-5 space-y-4">
                <Label className="font-heading font-semibold">
                  How many {orderType === "tanker" ? "tankers" : "cans"}?
                </Label>
                <div className="flex items-center justify-center gap-6">
                  <Button type="button" variant="outline" size="icon" className="rounded-xl h-12 w-12"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}>
                    <Minus className="h-5 w-5" />
                  </Button>
                  <div className="text-center">
                    <span className="text-5xl font-heading font-bold">{quantity}</span>
                    <p className="text-xs text-muted-foreground mt-1">{orderType === "tanker" ? "tanker(s)" : "can(s)"}</p>
                  </div>
                  <Button type="button" variant="outline" size="icon" className="rounded-xl h-12 w-12"
                    onClick={() => setQuantity(quantity + 1)}>
                    <Plus className="h-5 w-5" />
                  </Button>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl glass" onClick={() => goTo(1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button className="flex-1 rounded-xl h-12 text-base" disabled={!orderType} onClick={() => goTo(3)}>
                Choose Supplier <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Supplier Selection */}
        {step === 3 && (
          <motion.div key="step3" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}
            className="space-y-4">

            <div className="glass-card rounded-2xl p-4">
              <h3 className="font-heading font-semibold mb-1">Select a supplier</h3>
              <p className="text-xs text-muted-foreground">
                {matchedSuppliers.length} supplier{matchedSuppliers.length !== 1 ? "s" : ""} near {pincodeData?.area || "you"}
              </p>
            </div>

            <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
              {matchedSuppliers.length === 0 ? (
                <div className="text-center py-10 text-muted-foreground">
                  <Droplets className="h-10 w-10 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No suppliers in this area yet.</p>
                </div>
              ) : (
                matchedSuppliers.map(s => {
                  const price = orderType === "tanker" ? Number(s.price_per_tanker) : Number(s.price_per_can);
                  const eta = estimateDeliveryTime(s.pincode, pincode);
                  const isSelected = supplierId === s.id;
                  return (
                    <motion.button key={s.id}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      onClick={() => setSupplierId(s.id)}
                      className={`w-full text-left glass-card rounded-2xl p-4 transition-all border-2 ${
                        isSelected ? "border-primary shadow-lg shadow-primary/10" : "border-transparent hover:border-muted-foreground/20"
                      }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className={`h-11 w-11 rounded-xl flex items-center justify-center text-xl shrink-0 ${
                            isSelected ? "bg-primary/15" : "bg-muted/50"
                          }`}>🚛</div>
                          <div>
                            <p className="font-medium">{s.business_name}</p>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                              <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.area}</span>
                              <span>·</span>
                              <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /><span className="text-primary font-semibold">{eta.label}</span></span>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <div className="flex items-center gap-0.5">
                                <Star className="h-3 w-3 fill-warning text-warning" />
                                <span className="text-xs font-medium">{Number(s.rating).toFixed(1)}</span>
                              </div>
                              <Badge variant="outline" className="text-[10px] rounded-md">{s.water_type}</Badge>
                              {(s as any).tanker_capacity && orderType === "tanker" && (
                                <Badge variant="outline" className="text-[10px] rounded-md">{(s as any).tanker_capacity}L</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-heading font-bold text-primary text-lg">₹{price}</p>
                          <p className="text-[10px] text-muted-foreground">per {orderType}</p>
                        </div>
                      </div>
                      {isSelected && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                          className="mt-3 pt-3 border-t border-border/50">
                          <div className="rounded-xl bg-primary/5 p-3 flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{quantity} × ₹{price}</span>
                            <span className="font-heading font-bold text-primary text-lg">₹{price * quantity}</span>
                          </div>
                        </motion.div>
                      )}
                    </motion.button>
                  );
                })
              )}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl glass" onClick={() => goTo(2)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button className="flex-1 rounded-xl h-12 text-base" disabled={!supplierId} onClick={() => goTo(4)}>
                Review Order <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 4: Confirm & Pay */}
        {step === 4 && supplier && (
          <motion.div key="step4" custom={direction} variants={slideVariants}
            initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }}
            className="space-y-4">

            <div className="glass-card rounded-2xl overflow-hidden">
              {/* Order summary header */}
              <div className="bg-gradient-to-r from-primary/10 to-accent/10 p-4 border-b border-border/30">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-card/80 flex items-center justify-center text-2xl">🚛</div>
                  <div>
                    <p className="font-heading font-semibold">{supplier.business_name}</p>
                    <p className="text-xs text-muted-foreground">{supplier.area} · {supplier.delivery_time}</p>
                  </div>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Delivery Type</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {orderType === "tanker" ? <Truck className="h-3.5 w-3.5" /> : <ShoppingCart className="h-3.5 w-3.5" />}
                    {orderType === "tanker" ? "Full Tanker" : "Water Cans"}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Quantity</span>
                  <span className="font-medium">{quantity} {orderType === "tanker" ? "tanker(s)" : "can(s)"}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unit Price</span>
                  <span className="font-medium">₹{unitPrice} / {orderType}</span>
                </div>
                {(supplier as any).driver_phone && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" /> Driver</span>
                    <span className="font-medium">{(supplier as any).driver_phone}</span>
                  </div>
                )}
                {(supplier as any).vehicle_number && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Vehicle</span>
                    <span className="font-medium">{(supplier as any).vehicle_number}</span>
                  </div>
                )}

                <div className="h-px bg-border" />

                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> Deliver to</span>
                  <span className="font-medium text-right max-w-[55%]">{address}</span>
                </div>

                <div className="h-px bg-border" />

                <div className="flex justify-between items-center pt-1">
                  <span className="font-heading font-semibold">Total</span>
                  <span className="text-3xl font-heading font-bold text-primary">₹{total}</span>
                </div>
              </div>
            </div>

            {/* Estimated delivery */}
            <div className="rounded-2xl bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Estimated Delivery: {supplier.delivery_time}</p>
                <p className="text-xs text-muted-foreground">You'll get live tracking updates</p>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="rounded-xl glass" onClick={() => goTo(3)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              <Button className="flex-1 rounded-xl h-12 text-base font-semibold" size="lg"
                disabled={loading} onClick={handleOrder}>
                {loading ? (
                  <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Booking...</>
                ) : (
                  <>Book Now — ₹{total}</>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
