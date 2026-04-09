import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star, Truck, Phone, Hash, Droplets, Navigation, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";

export default function SupplierProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: feedbacks = [] } = useQuery({
    queryKey: ["supplier-feedback", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("feedback")
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const [form, setForm] = useState({
    business_name: "",
    area: "",
    price_per_can: 40,
    price_per_tanker: 500,
    water_type: "RO Purified",
    stock: 0,
    delivery_time: "30-45 min",
    tanker_capacity: 5000,
    driver_phone: "",
    vehicle_number: "",
    pincode: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        business_name: supplier.business_name,
        area: supplier.area,
        price_per_can: Number(supplier.price_per_can),
        price_per_tanker: Number((supplier as any).price_per_tanker ?? 500),
        water_type: supplier.water_type,
        stock: supplier.stock,
        delivery_time: supplier.delivery_time,
        tanker_capacity: (supplier as any).tanker_capacity ?? 5000,
        driver_phone: (supplier as any).driver_phone ?? "",
        vehicle_number: (supplier as any).vehicle_number ?? "",
        pincode: (supplier as any).pincode ?? "",
      });
    }
  }, [supplier]);

  // Auto-lookup pincode and fill area
  useEffect(() => {
    if (form.pincode.length === 6) {
      lookup(form.pincode);
    }
  }, [form.pincode, lookup]);

  useEffect(() => {
    if (pincodeData) {
      setForm(prev => ({ ...prev, area: `${pincodeData.area}, ${pincodeData.city}, ${pincodeData.district}` }));
    }
  }, [pincodeData]);

  const handleSave = async () => {
    if (!supplier) return;
    const { error } = await supabase
      .from("suppliers")
      .update(form as any)
      .eq("id", supplier.id);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Profile updated!" });
      queryClient.invalidateQueries({ queryKey: ["my-supplier"] });
    }
  };

  if (!supplier) return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Supplier Profile</h2>
        <p className="text-muted-foreground">Manage your tanker business information.</p>
      </motion.div>

      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold">Business Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><Label>Business Name</Label><Input className="mt-1 rounded-xl" value={form.business_name} onChange={e => setForm({...form, business_name: e.target.value})} /></div>
          <div>
            <Label className="flex items-center gap-1.5"><Navigation className="h-3.5 w-3.5" /> Pincode</Label>
            <Input className="mt-1 rounded-xl" placeholder="Enter 6-digit pincode" maxLength={6}
              value={form.pincode} onChange={e => setForm({...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6)})} />
            {pincodeLoading && <p className="text-xs text-muted-foreground animate-pulse mt-1">Looking up...</p>}
            {pincodeData && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <MapPin className="h-3 w-3 text-primary" />
                {pincodeData.area}, {pincodeData.city}, {pincodeData.state}
              </p>
            )}
          </div>
          <div className="sm:col-span-2"><Label>Service Area (auto-filled from pincode)</Label><Input className="mt-1 rounded-xl" value={form.area} onChange={e => setForm({...form, area: e.target.value})} /></div>
          <div><Label>Water Type</Label><Input className="mt-1 rounded-xl" value={form.water_type} onChange={e => setForm({...form, water_type: e.target.value})} /></div>
          <div><Label>Available Stock (cans)</Label><Input type="number" className="mt-1 rounded-xl" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} /></div>
          <div><Label>Delivery Time</Label><Input className="mt-1 rounded-xl" value={form.delivery_time} onChange={e => setForm({...form, delivery_time: e.target.value})} /></div>
        </div>
      </div>

      {/* Pricing */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold flex items-center gap-2">💰 Pricing</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label>Price per Can (₹)</Label>
            <Input type="number" className="mt-1 rounded-xl" value={form.price_per_can} onChange={e => setForm({...form, price_per_can: Number(e.target.value)})} />
            <p className="text-xs text-muted-foreground mt-1">For individual 20L can orders</p>
          </div>
          <div>
            <Label>Price per Tanker (₹)</Label>
            <Input type="number" className="mt-1 rounded-xl" value={form.price_per_tanker} onChange={e => setForm({...form, price_per_tanker: Number(e.target.value)})} />
            <p className="text-xs text-muted-foreground mt-1">For full tanker delivery</p>
          </div>
        </div>
      </div>

      {/* Tanker & Driver */}
      <div className="glass-card rounded-2xl p-6 space-y-5">
        <h3 className="font-heading font-semibold flex items-center gap-2"><Truck className="h-5 w-5 text-primary" /> Tanker & Driver Details</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> Tanker Capacity (Liters)</Label>
            <Input type="number" className="mt-1 rounded-xl" value={form.tanker_capacity} onChange={e => setForm({...form, tanker_capacity: Number(e.target.value)})} />
          </div>
          <div>
            <Label className="flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" /> Driver Phone Number</Label>
            <Input className="mt-1 rounded-xl" placeholder="+91 98765 43210" value={form.driver_phone} onChange={e => setForm({...form, driver_phone: e.target.value})} />
          </div>
          <div className="sm:col-span-2">
            <Label className="flex items-center gap-1.5"><Hash className="h-3.5 w-3.5" /> Vehicle Number</Label>
            <Input className="mt-1 rounded-xl" placeholder="MH 12 AB 1234" value={form.vehicle_number} onChange={e => setForm({...form, vehicle_number: e.target.value})} />
          </div>
        </div>
      </div>

      <Button onClick={handleSave} className="rounded-xl w-full sm:w-auto" size="lg">Save All Changes</Button>

      <div className="glass-card rounded-2xl p-6 space-y-4">
        <h3 className="font-heading font-semibold">Customer Feedback</h3>
        {feedbacks.length === 0 ? (
          <p className="text-muted-foreground text-sm">No feedback yet.</p>
        ) : (
          feedbacks.map(f => (
            <div key={f.id} className="p-4 rounded-xl bg-muted/30">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < f.rating ? "fill-warning text-warning" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              {f.comment && <p className="text-sm text-muted-foreground">{f.comment}</p>}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
