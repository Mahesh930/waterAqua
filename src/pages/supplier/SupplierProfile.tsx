import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function SupplierProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

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
    water_type: "RO Purified",
    stock: 0,
    delivery_time: "30-45 min",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        business_name: supplier.business_name,
        area: supplier.area,
        price_per_can: Number(supplier.price_per_can),
        water_type: supplier.water_type,
        stock: supplier.stock,
        delivery_time: supplier.delivery_time,
      });
    }
  }, [supplier]);

  const handleSave = async () => {
    if (!supplier) return;
    const { error } = await supabase
      .from("suppliers")
      .update(form)
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
          <div><Label>Service Area</Label><Input className="mt-1 rounded-xl" value={form.area} onChange={e => setForm({...form, area: e.target.value})} /></div>
          <div><Label>Price per Can (₹)</Label><Input type="number" className="mt-1 rounded-xl" value={form.price_per_can} onChange={e => setForm({...form, price_per_can: Number(e.target.value)})} /></div>
          <div><Label>Water Type</Label><Input className="mt-1 rounded-xl" value={form.water_type} onChange={e => setForm({...form, water_type: e.target.value})} /></div>
          <div><Label>Available Stock (cans)</Label><Input type="number" className="mt-1 rounded-xl" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} /></div>
          <div><Label>Delivery Time</Label><Input className="mt-1 rounded-xl" value={form.delivery_time} onChange={e => setForm({...form, delivery_time: e.target.value})} /></div>
        </div>
        <Button onClick={handleSave} className="rounded-xl">Save Changes</Button>
      </div>

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
