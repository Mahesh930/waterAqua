import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star, Truck, Phone, Hash, Droplets, Navigation, MapPin, Save, Shield, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";
import { Switch } from "@/components/ui/switch";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SupplierProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["supplier-feedback", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("feedback").select("*").eq("supplier_id", supplier!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const [form, setForm] = useState({
    business_name: "", area: "", price_per_can: 40, price_per_tanker: 500,
    water_type: "RO Purified", stock: 0, delivery_time: "30-45 min",
    tanker_capacity: 5000, driver_phone: "", vehicle_number: "", pincode: "", available: true,
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        business_name: supplier.business_name, area: supplier.area,
        price_per_can: Number(supplier.price_per_can), price_per_tanker: Number(supplier.price_per_tanker),
        water_type: supplier.water_type, stock: supplier.stock,
        delivery_time: supplier.delivery_time, tanker_capacity: supplier.tanker_capacity,
        driver_phone: supplier.driver_phone ?? "", vehicle_number: supplier.vehicle_number ?? "",
        pincode: supplier.pincode ?? "", available: supplier.available,
      });
    }
  }, [supplier]);

  useEffect(() => { if (form.pincode.length === 6) lookup(form.pincode); }, [form.pincode, lookup]);
  useEffect(() => { if (pincodeData) setForm(prev => ({ ...prev, area: `${pincodeData.area}, ${pincodeData.city}, ${pincodeData.district}` })); }, [pincodeData]);

  const handleSave = async () => {
    if (!supplier) return;
    const { error } = await supabase.from("suppliers").update(form as any).eq("id", supplier.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile updated! ✅" }); queryClient.invalidateQueries({ queryKey: ["my-supplier"] }); }
  };

  if (!supplier) return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
      <p className="text-sm text-muted-foreground">Loading profile...</p>
    </div>
  );

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <motion.div variants={item} className="glass-card rounded-3xl overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary via-blue-600 to-accent relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          </div>
        </div>
        <div className="px-5 pb-5 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center text-3xl">🚛</div>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">{supplier.business_name}</h2>
              <p className="text-sm text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {supplier.area}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Star className="h-4 w-4 fill-warning text-warning" />
                <span className="font-heading font-bold">{Number(supplier.rating).toFixed(1)}</span>
              </div>
              <span className="text-xs text-muted-foreground">({supplier.review_count})</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[
              { label: "Stock", value: `${supplier.stock} cans`, color: "text-primary" },
              { label: "Can Price", value: `₹${Number(supplier.price_per_can)}`, color: "text-success" },
              { label: "Tanker Price", value: `₹${Number(supplier.price_per_tanker)}`, color: "text-accent" },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className={`font-heading font-bold text-lg ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Availability Toggle */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 flex items-center justify-between">
        <div>
          <h3 className="font-heading font-semibold">Availability</h3>
          <p className="text-xs text-muted-foreground">Toggle to go online/offline for new orders</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${form.available ? "text-success" : "text-muted-foreground"}`}>
            {form.available ? "🟢 Online" : "⚫ Offline"}
          </span>
          <Switch checked={form.available} onCheckedChange={v => setForm({ ...form, available: v })} />
        </div>
      </motion.div>

      {/* Business Details */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Business Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-xs">Business Name</Label><Input className="mt-1 rounded-xl" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} /></div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Navigation className="h-3 w-3" /> Pincode</Label>
            <Input className="mt-1 rounded-xl" placeholder="6-digit pincode" maxLength={6}
              value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
            {pincodeLoading && <p className="text-[10px] text-primary animate-pulse mt-1">Looking up...</p>}
            {pincodeData && (
              <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-success" />{pincodeData.area}, {pincodeData.city}
              </p>
            )}
          </div>
          <div className="sm:col-span-2"><Label className="text-xs">Service Area</Label><Input className="mt-1 rounded-xl" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} /></div>
          <div><Label className="text-xs">Water Type</Label><Input className="mt-1 rounded-xl" value={form.water_type} onChange={e => setForm({ ...form, water_type: e.target.value })} /></div>
          <div><Label className="text-xs">Stock (cans)</Label><Input type="number" className="mt-1 rounded-xl" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} /></div>
          <div><Label className="text-xs">Delivery Time</Label><Input className="mt-1 rounded-xl" value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} /></div>
        </div>
      </motion.div>

      {/* Pricing */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-heading font-semibold">💰 Pricing</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="glass rounded-xl p-4 text-center">
            <Droplets className="h-5 w-5 text-primary mx-auto mb-2" />
            <Label className="text-xs">Price per Can (₹)</Label>
            <Input type="number" className="mt-2 rounded-xl text-center text-lg font-bold" value={form.price_per_can} onChange={e => setForm({ ...form, price_per_can: Number(e.target.value) })} />
          </div>
          <div className="glass rounded-xl p-4 text-center">
            <Truck className="h-5 w-5 text-accent mx-auto mb-2" />
            <Label className="text-xs">Price per Tanker (₹)</Label>
            <Input type="number" className="mt-2 rounded-xl text-center text-lg font-bold" value={form.price_per_tanker} onChange={e => setForm({ ...form, price_per_tanker: Number(e.target.value) })} />
          </div>
        </div>
      </motion.div>

      {/* Tanker & Driver */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> Vehicle & Driver</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label className="text-xs flex items-center gap-1"><Droplets className="h-3 w-3" /> Tanker Capacity (L)</Label><Input type="number" className="mt-1 rounded-xl" value={form.tanker_capacity} onChange={e => setForm({ ...form, tanker_capacity: Number(e.target.value) })} /></div>
          <div><Label className="text-xs flex items-center gap-1"><Phone className="h-3 w-3" /> Driver Phone</Label><Input className="mt-1 rounded-xl" placeholder="+91 98765 43210" value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label className="text-xs flex items-center gap-1"><Hash className="h-3 w-3" /> Vehicle Number</Label><Input className="mt-1 rounded-xl" placeholder="MH 12 AB 1234" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} /></div>
        </div>
      </motion.div>

      <motion.div variants={item}>
        <Button onClick={handleSave} className="rounded-xl w-full h-12 text-base font-semibold gap-2 shadow-md shadow-primary/10" size="lg">
          <Save className="h-4 w-4" /> Save All Changes
        </Button>
      </motion.div>

      {/* Reviews */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5 space-y-4">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <Star className="h-4 w-4 text-warning" /> Customer Reviews ({feedbacks.length})
        </h3>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.slice(0, 10).map(f => (
              <div key={f.id} className="glass rounded-xl p-4">
                <div className="flex items-center gap-1 mb-1.5">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < f.rating ? "fill-warning text-warning" : "text-muted"}`} />
                  ))}
                  <span className="text-xs text-muted-foreground ml-2">
                    {new Date(f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                </div>
                {f.comment && <p className="text-sm text-muted-foreground">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
