import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Droplets, Search, Navigation, ShoppingCart, Truck as TruckIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const navigate = useNavigate();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();

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

  // Auto-lookup pincode
  useEffect(() => {
    if (pincodeInput.length === 6) {
      lookup(pincodeInput);
    }
  }, [pincodeInput, lookup]);

  // Auto-set location filter from pincode
  useEffect(() => {
    if (pincodeData) {
      setLocationFilter(pincodeData.area);
    }
  }, [pincodeData]);

  const areas = [...new Set(suppliers.map(s => s.area))];

  const filtered = suppliers.filter(s => {
    const matchesSearch = s.business_name.toLowerCase().includes(search.toLowerCase()) ||
      s.area.toLowerCase().includes(search.toLowerCase()) ||
      s.water_type.toLowerCase().includes(search.toLowerCase());
    const matchesLocation = !locationFilter || s.area.toLowerCase().includes(locationFilter.toLowerCase());
    // Also match by pincode if supplier has one
    const matchesPincode = !pincodeInput || !pincodeData || 
      (s as any).pincode === pincodeInput || 
      s.area.toLowerCase().includes((pincodeData?.city || "").toLowerCase()) ||
      s.area.toLowerCase().includes((pincodeData?.area || "").toLowerCase());
    return matchesSearch && (matchesLocation || matchesPincode);
  });

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Find Tanker Suppliers</h2>
        <p className="text-muted-foreground">Browse verified water tanker suppliers in your area.</p>
      </motion.div>

      {/* Search & Pincode bar */}
      <div className="glass-card rounded-2xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search by name, area, water type..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <div className="relative w-full sm:w-48">
            <Navigation className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Enter Pincode" 
              value={pincodeInput} 
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincodeInput(v);
                if (v.length < 6) { setLocationFilter(""); }
              }} 
              className="pl-10 rounded-xl" 
              maxLength={6}
            />
          </div>
        </div>
        {pincodeLoading && <p className="text-xs text-muted-foreground animate-pulse">Looking up pincode...</p>}
        {pincodeData && (
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-3.5 w-3.5 text-primary" />
            <span className="text-muted-foreground">
              {pincodeData.area}, {pincodeData.city}, {pincodeData.district}, {pincodeData.state}
            </span>
            <Badge variant="outline" className="rounded-lg text-xs">{pincodeData.pincode}</Badge>
          </div>
        )}
      </div>

      {/* Area pills */}
      {areas.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => { setLocationFilter(""); setPincodeInput(""); }}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
              !locationFilter ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
            }`}>All Areas</button>
          {areas.slice(0, 8).map(a => (
            <button key={a} onClick={() => setLocationFilter(a)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                locationFilter === a ? "bg-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"
              }`}>{a}</button>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Droplets className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No suppliers found</p>
          <p className="text-sm mt-1">Try a different pincode or search term.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((s, i) => (
            <motion.div key={s.id}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className={`glass-card rounded-2xl p-5 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group ${!s.available ? "opacity-50" : ""}`}>
              <div className="flex items-start justify-between mb-3">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-2xl">
                  🚛
                </div>
                <div className="flex flex-col items-end gap-1">
                  {!s.available && <Badge variant="secondary" className="rounded-lg">Unavailable</Badge>}
                  {(s as any).pincode && <Badge variant="outline" className="rounded-lg text-[10px]">{(s as any).pincode}</Badge>}
                </div>
              </div>
              <h3 className="font-heading font-semibold text-base mb-2">{s.business_name}</h3>
              <div className="space-y-1.5 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-primary/60" /> {s.area}</div>
                <div className="flex items-center gap-2"><Droplets className="h-3.5 w-3.5 text-primary/60" /> {s.water_type}</div>
                <div className="flex items-center gap-2"><Clock className="h-3.5 w-3.5 text-primary/60" /> {s.delivery_time}</div>
              </div>

              {/* Pricing */}
              <div className="rounded-xl bg-muted/30 p-3 mb-3 space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><ShoppingCart className="h-3.5 w-3.5" /> Per Can</span>
                  <span className="font-heading font-bold text-primary">₹{Number(s.price_per_can)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1.5 text-muted-foreground"><TruckIcon className="h-3.5 w-3.5" /> Per Tanker</span>
                  <span className="font-heading font-bold text-accent">₹{Number((s as any).price_per_tanker || 500)}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-1.5">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium text-sm">{Number(s.rating).toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground">({s.review_count})</span>
                </div>
                <span className="text-xs text-muted-foreground">{s.stock} cans in stock</span>
              </div>
              {s.available && (
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 rounded-xl" onClick={() => navigate(`/customer/order?supplier=${s.id}&type=can`)}>
                    Order Cans
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1 rounded-xl glass" onClick={() => navigate(`/customer/order?supplier=${s.id}&type=tanker`)}>
                    Order Tanker
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
