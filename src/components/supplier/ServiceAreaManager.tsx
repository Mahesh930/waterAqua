import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Plus, Trash2, Locate, Navigation, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePincode } from "@/hooks/use-pincode";
import { motion, AnimatePresence } from "framer-motion";

interface Props {
  supplierId: string;
}

export default function ServiceAreaManager({ supplierId }: Props) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newPincode, setNewPincode] = useState("");
  const { lookup, data: pincodeData, loading: pincodeLoading, reset } = usePincode();
  const [gpsLoading, setGpsLoading] = useState(false);

  const { data: areas = [], isLoading } = useQuery({
    queryKey: ["supplier-service-areas", supplierId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_service_areas")
        .select("*")
        .eq("supplier_id", supplierId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplierId,
  });

  const handlePincodeChange = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setNewPincode(clean);
    if (clean.length === 6) lookup(clean);
  };

  const addArea = async () => {
    if (!pincodeData || newPincode.length !== 6) {
      toast({ title: "Enter a valid 6-digit pincode", variant: "destructive" });
      return;
    }

    if (areas.some(a => a.pincode === newPincode)) {
      toast({ title: "Pincode already added", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("supplier_service_areas").insert({
      supplier_id: supplierId,
      pincode: newPincode,
      area_name: pincodeData.area,
      city: pincodeData.city,
      state: pincodeData.state,
    } as any);

    if (error) {
      toast({ title: "Failed to add area", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `${pincodeData.area} added ✅` });
      queryClient.invalidateQueries({ queryKey: ["supplier-service-areas"] });
      setNewPincode("");
      reset();
    }
  };

  const removeArea = async (id: string) => {
    const { error } = await supabase.from("supplier_service_areas").delete().eq("id", id);
    if (error) toast({ title: "Remove failed", description: error.message, variant: "destructive" });
    else {
      toast({ title: "Area removed" });
      queryClient.invalidateQueries({ queryKey: ["supplier-service-areas"] });
    }
  };

  const handleGPS = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", variant: "destructive" });
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const postcode = data.address?.postcode;
          if (postcode && postcode.length === 6) {
            setNewPincode(postcode);
            lookup(postcode);
          } else {
            toast({ title: "Could not detect pincode", description: "Enter manually" });
          }
        } catch {
          toast({ title: "Location lookup failed", variant: "destructive" });
        }
        setGpsLoading(false);
      },
      () => {
        toast({ title: "Location access denied", variant: "destructive" });
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-heading font-semibold flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Service Areas
        </h3>
        <Badge variant="outline" className="text-[10px]">{areas.length} area{areas.length !== 1 ? "s" : ""}</Badge>
      </div>

      <p className="text-xs text-muted-foreground">Add pincodes where you deliver. Customers in these areas will see your products.</p>

      {/* Add new area */}
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input
              placeholder="Enter 6-digit pincode"
              value={newPincode}
              onChange={e => handlePincodeChange(e.target.value)}
              className="pl-10 rounded-xl h-11 bg-primary/5 border-primary/20 font-medium"
              maxLength={6}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0"
            onClick={handleGPS} disabled={gpsLoading}>
            <Locate className={`h-4 w-4 ${gpsLoading ? "animate-pulse" : ""}`} />
          </Button>
          <Button className="rounded-xl h-11 gap-1.5 shrink-0" onClick={addArea}
            disabled={!pincodeData || newPincode.length !== 6}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {pincodeLoading && <p className="text-[10px] text-primary animate-pulse">🔍 Looking up...</p>}
        {pincodeData && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <CheckCircle2 className="h-3.5 w-3.5 text-success shrink-0" />
            <span className="text-xs font-medium">{pincodeData.area}, {pincodeData.city}, {pincodeData.state}</span>
          </motion.div>
        )}
      </div>

      {/* Area list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-6 text-muted-foreground">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">No service areas added yet</p>
          <p className="text-xs mt-1">Add pincodes where you provide delivery</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {areas.map(area => (
              <motion.div key={area.id}
                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }}
                className="glass rounded-xl p-3 flex items-center gap-3 group">
                <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-4 w-4 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{area.area_name || area.pincode}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {area.city}{area.state ? `, ${area.state}` : ""} · {area.pincode}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10"
                  onClick={() => removeArea(area.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
