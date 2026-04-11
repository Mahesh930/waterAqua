import { useState, useEffect, useMemo } from "react";
import { Star, MapPin, Clock, Droplets, Search, Navigation, ShoppingCart, Truck as TruckIcon, ChevronRight, Locate } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";
import { estimateDeliveryTime } from "@/lib/delivery-estimate";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "name">("rating");
  const [gpsLoading, setGpsLoading] = useState(false);
  const navigate = useNavigate();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();
  const { toast } = useToast();

  const handleGPS = () => {
    if (!navigator.geolocation) { toast({ title: "GPS not supported", variant: "destructive" }); return; }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1`);
          const data = await res.json();
          const postcode = data.address?.postcode;
          if (postcode && postcode.length === 6) setPincodeInput(postcode);
          else toast({ title: "Could not detect pincode", description: "Please enter manually" });
        } catch { toast({ title: "Location lookup failed", variant: "destructive" }); }
        setGpsLoading(false);
      },
      () => { toast({ title: "Location access denied", variant: "destructive" }); setGpsLoading(false); },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("blocked", false)
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  useEffect(() => {
    if (pincodeInput.length === 6) lookup(pincodeInput);
  }, [pincodeInput, lookup]);

  // Strict pincode-based filtering: only show suppliers in same pincode/area
  const filtered = useMemo(() => {
    let list = suppliers;

    // If pincode entered and resolved, strictly filter
    if (pincodeData && pincodeInput.length === 6) {
      list = list.filter(s => {
        // Exact pincode match
        if (s.pincode === pincodeInput) return true;
        // Same area/city match
        const area = s.area.toLowerCase();
        return area.includes(pincodeData.area.toLowerCase()) ||
               area.includes(pincodeData.city.toLowerCase());
      });
    }

    // Text search within filtered results
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.business_name.toLowerCase().includes(q) ||
        s.water_type.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => {
      if (sortBy === "price") return Number(a.price_per_can) - Number(b.price_per_can);
      if (sortBy === "name") return a.business_name.localeCompare(b.business_name);
      return Number(b.rating) - Number(a.rating);
    });
  }, [suppliers, pincodeData, pincodeInput, search, sortBy]);

  const hasPincode = pincodeInput.length === 6 && pincodeData;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Find Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {hasPincode
              ? `${filtered.length} suppliers in ${pincodeData.area}, ${pincodeData.city}`
              : "Enter your pincode to see nearby suppliers"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {(["rating", "price", "name"] as const).map(s => (
            <button key={s} onClick={() => setSortBy(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                sortBy === s ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
              }`}>
              {s === "rating" ? "⭐ Rating" : s === "price" ? "💰 Price" : "🔤 Name"}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search & Pincode */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4 shadow-lg ring-1 ring-primary/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search supplier or water type..." value={search} onChange={e => setSearch(e.target.value)} 
              className="pl-10 rounded-xl h-11 bg-muted/30 border-0 focus-visible:ring-primary/30" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-44">
              <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input 
                placeholder="Pincode" 
                value={pincodeInput} 
                onChange={e => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                className="pl-10 rounded-xl h-11 bg-primary/5 border-primary/20 focus-visible:ring-primary/30 font-medium" 
                maxLength={6}
              />
            </div>
            <Button variant="outline" size="icon" className="h-11 w-11 rounded-xl shrink-0"
              onClick={handleGPS} disabled={gpsLoading}>
              <Locate className={`h-4 w-4 ${gpsLoading ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
        {pincodeLoading && <p className="text-xs text-primary animate-pulse mt-2">🔍 Looking up pincode...</p>}
        {pincodeData && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">{pincodeData.area}, {pincodeData.city}</span>
            <span className="text-xs text-muted-foreground">{pincodeData.district}, {pincodeData.state}</span>
            <Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{pincodeData.pincode}</Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Prompt if no pincode */}
      {!hasPincode && !isLoading && (
        <motion.div variants={item} className="glass-card rounded-2xl p-8 text-center">
          <div className="h-16 w-16 mx-auto mb-3 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Navigation className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-heading font-semibold text-lg">Enter your delivery pincode</h3>
          <p className="text-sm text-muted-foreground mt-1 mb-3">Or use GPS to detect automatically</p>
          <Button variant="outline" className="rounded-xl gap-2" onClick={handleGPS} disabled={gpsLoading}>
            <Locate className="h-4 w-4" /> {gpsLoading ? "Detecting..." : "Use My Location"}
          </Button>
        </motion.div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Finding suppliers...</p>
        </div>
      ) : hasPincode && filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No suppliers in your area</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different pincode.</p>
        </div>
      ) : hasPincode && (
        <>
          <motion.p variants={item} className="text-xs text-muted-foreground font-medium">
            Showing {filtered.length} supplier{filtered.length !== 1 ? "s" : ""} near {pincodeData!.area}
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(s => {
              const eta = estimateDeliveryTime(s.pincode, pincodeInput);
              return (
                <motion.div key={s.id} variants={item}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group ${!s.available ? "opacity-50 pointer-events-none" : ""}`}>
                  
                  {/* Card Header */}
                  <div className="relative h-20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-4">
                    <div className="flex items-start justify-between">
                      <div className="h-14 w-14 rounded-2xl bg-card shadow-lg flex items-center justify-center text-2xl border border-border/50">🚛</div>
                      <div className="flex items-center gap-1.5">
                        {s.available && s.stock > 0 && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold text-success bg-success/10 px-2 py-0.5 rounded-full">
                            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Available
                          </span>
                        )}
                        {!s.available && <Badge variant="secondary" className="rounded-lg text-[10px]">Offline</Badge>}
                      </div>
                    </div>
                  </div>

                  <div className="p-4 pt-2 space-y-3">
                    <div>
                      <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors">{s.business_name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-sm font-bold">{Number(s.rating).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({s.review_count})</span>
                        {Number(s.rating) >= 4.5 && (
                          <Badge className="bg-warning/10 text-warning border-0 text-[9px] px-1.5">TOP RATED</Badge>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary/60 shrink-0" /> {s.area}</div>
                      <div className="flex items-center gap-2"><Droplets className="h-3 w-3 text-primary/60 shrink-0" /> {s.water_type}</div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3 text-primary/60 shrink-0" />
                        <span className="text-primary font-semibold">ETA: {eta.label}</span>
                        <span>· {s.stock} cans</span>
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl bg-primary/5 border border-primary/10 p-2.5 text-center">
                        <ShoppingCart className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                        <p className="font-heading font-bold text-primary text-lg leading-none">₹{Number(s.price_per_can)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">per can</p>
                      </div>
                      <div className="rounded-xl bg-accent/5 border border-accent/10 p-2.5 text-center">
                        <TruckIcon className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                        <p className="font-heading font-bold text-accent text-lg leading-none">₹{Number(s.price_per_tanker)}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">per tanker</p>
                      </div>
                    </div>

                    {s.available && (
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="flex-1 rounded-xl h-9 text-xs font-semibold gap-1.5 shadow-md shadow-primary/10" 
                          onClick={() => navigate(`/customer/order?supplier=${s.id}&type=can`)}>
                          <ShoppingCart className="h-3 w-3" /> Order Cans
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1 rounded-xl h-9 text-xs font-semibold gap-1.5 glass hover:bg-accent/10 hover:text-accent hover:border-accent/30" 
                          onClick={() => navigate(`/customer/order?supplier=${s.id}&type=tanker`)}>
                          <TruckIcon className="h-3 w-3" /> Tanker
                        </Button>
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </>
      )}
    </motion.div>
  );
}
