import React, { useState } from "react";
import { Input } from "@/ui/input";
import { Button } from "@/ui/button";
import { Badge } from "@/ui/badge";
import { MapPin, Plus, Trash2, Locate, Navigation, CheckCircle2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useGetMySupplierQuery, useUpdateSupplierMutation } from "@/store/api";
import { usePincode } from "@/shared/hooks/use-pincode";
import { motion, AnimatePresence } from "framer-motion";

export default function ServiceAreaManager({ disabled = false }) {
  const { toast } = useToast();
  const [newPincode, setNewPincode] = useState("");
  const { lookup, data: pincodeData, loading: pincodeLoading, reset } = usePincode();
  const [gpsLoading, setGpsLoading] = useState(false);

  // RTK Queries & Mutations
  const { data: supplier, isLoading } = useGetMySupplierQuery();
  const [updateSupplier] = useUpdateSupplierMutation();

  const areas = supplier?.serviceAreas || [];

  const handlePincodeChange = (val) => {
    const clean = val.replace(/\D/g, "").slice(0, 6);
    setNewPincode(clean);
    if (clean.length === 6) {
      lookup(clean);
    }
  };

  const addArea = async () => {
    if (!pincodeData || newPincode.length !== 6) {
      toast({ title: "Enter a valid 6-digit pincode", variant: "destructive" });
      return;
    }

    if (areas.includes(newPincode)) {
      toast({ title: "Pincode already added", variant: "destructive" });
      return;
    }

    const updatedAreas = [...areas, newPincode];

    try {
      await updateSupplier({ serviceAreas: updatedAreas }).unwrap();
      toast({ title: `${pincodeData.area} (${newPincode}) added ✅` });
      setNewPincode("");
      reset();
    } catch (error) {
      toast({
        title: "Failed to add area",
        description: error?.data?.error || error?.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const removeArea = async (pincodeToRemove) => {
    const updatedAreas = areas.filter(a => a !== pincodeToRemove);
    try {
      await updateSupplier({ serviceAreas: updatedAreas }).unwrap();
      toast({ title: "Area removed" });
    } catch (error) {
      toast({
        title: "Remove failed",
        description: error?.data?.error || error?.message || "An error occurred",
        variant: "destructive"
      });
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
          if (postcode && postcode.replace(/\s+/g, "").length >= 6) {
            const cleanPostcode = postcode.replace(/\s+/g, "").slice(0, 6);
            setNewPincode(cleanPostcode);
            lookup(cleanPostcode);
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
    <div className="space-y-4 text-slate-200">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <MapPin className="h-4 w-4 text-blue-400" /> Serviced Pincodes
        </h3>
        <Badge className="text-[10px] bg-blue-600/10 text-blue-400 border border-blue-500/10 font-bold">{areas.length} area{areas.length !== 1 ? "s" : ""}</Badge>
      </div>

      <p className="text-xs text-slate-500 font-semibold leading-relaxed">Add pincodes where you deliver. Customers in these areas will discover your water products catalog.</p>

      {/* Add new area */}
      <div className="space-y-2.5">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
            <Input
              placeholder="Enter 6-digit pincode"
              value={newPincode}
              onChange={e => handlePincodeChange(e.target.value)}
              className="pl-10 rounded-xl h-11 bg-[#090d22] border-white/5 font-semibold text-white focus-visible:ring-blue-500"
              maxLength={6}
              disabled={disabled}
            />
          </div>
          <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0 border-white/5 bg-[#0e142e] hover:bg-white/5 text-slate-300"
            onClick={handleGPS} disabled={gpsLoading || disabled}>
            <Locate className={`h-4 w-4 ${gpsLoading ? "animate-pulse" : ""}`} />
          </Button>
          <Button className="rounded-xl h-11 gap-1.5 shrink-0 bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={addArea}
            disabled={!pincodeData || newPincode.length !== 6 || disabled}>
            <Plus className="h-4 w-4" /> Add
          </Button>
        </div>

        {pincodeLoading && <p className="text-[10px] text-blue-400 animate-pulse font-semibold">🔍 Looking up area...</p>}
        {pincodeData && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 p-2.5 rounded-xl bg-blue-500/5 border border-blue-500/10 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
            <span className="text-xs font-semibold text-white">{pincodeData.area}, {pincodeData.city}, {pincodeData.state}</span>
          </motion.div>
        )}
      </div>

      {/* Area list */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <div className="animate-spin h-6 w-6 border-2 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : areas.length === 0 ? (
        <div className="text-center py-6 text-slate-500 bg-[#090d22]/30 border border-white/5 rounded-2xl">
          <MapPin className="h-8 w-8 mx-auto mb-2 opacity-30 text-slate-600" />
          <p className="text-sm font-semibold">No service areas added yet</p>
          <p className="text-xs mt-1 text-slate-600 font-semibold">Add pincodes where you provide delivery</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence>
            {areas.map(pincode => (
              <motion.div key={pincode}
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-[#090d22]/50 border border-white/5 rounded-xl p-3 flex items-center justify-between group"
              >
                <div className="min-w-0">
                  <p className="text-xs font-bold text-white tracking-wider">PINCODE</p>
                  <p className="text-sm font-black text-blue-400 mt-0.5">{pincode}</p>
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-rose-400 hover:text-white hover:bg-rose-500/10"
                  onClick={() => removeArea(pincode)} disabled={disabled}>
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
