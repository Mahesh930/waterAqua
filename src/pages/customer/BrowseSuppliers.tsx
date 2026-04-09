import { useState, useEffect } from "react";
import { Star, MapPin, Clock, Droplets, Search, Navigation, ShoppingCart, Truck as TruckIcon, Shield, Zap, ChevronRight, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { usePincode } from "@/hooks/use-pincode";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [sortBy, setSortBy] = useState<"rating" | "price" | "name">("rating");
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

  useEffect(() => {
    if (pincodeInput.length === 6) lookup(pincodeInput);
  }, [pincodeInput, lookup]);

  useEffect(() => {
    if (pincodeData) setLocationFilter(pincodeData.area);
  }, [pincodeData]);

  const areas = [...new Set(suppliers.map(s => s.area))];

  const filtered = suppliers
    .filter(s => {
      const matchesSearch = s.business_name.toLowerCase().includes(search.toLowerCase()) ||
        s.area.toLowerCase().includes(search.toLowerCase()) ||
        s.water_type.toLowerCase().includes(search.toLowerCase());
      const matchesLocation = !locationFilter || s.area.toLowerCase().includes(locationFilter.toLowerCase());
      const matchesPincode = !pincodeInput || !pincodeData || 
        (s as any).pincode === pincodeInput || 
        s.area.toLowerCase().includes((pincodeData?.city || "").toLowerCase()) ||
        s.area.toLowerCase().includes((pincodeData?.area || "").toLowerCase());
      return matchesSearch && (matchesLocation || matchesPincode);
    })
    .sort((a, b) => {
      if (sortBy === "price") return Number(a.price_per_can) - Number(b.price_per_can);
      if (sortBy === "name") return a.business_name.localeCompare(b.business_name);
      return Number(b.rating) - Number(a.rating);
    });

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header with stats */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Find Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {suppliers.length} verified suppliers · {areas.length} service areas
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

      {/* Search Bar — elevated glass */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4 shadow-lg ring-1 ring-primary/5">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search supplier, area, water type..." value={search} onChange={e => setSearch(e.target.value)} 
              className="pl-10 rounded-xl h-11 bg-muted/30 border-0 focus-visible:ring-primary/30" />
          </div>
          <div className="relative w-full sm:w-52">
            <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <Input 
              placeholder="Enter Pincode" 
              value={pincodeInput} 
              onChange={e => {
                const v = e.target.value.replace(/\D/g, "").slice(0, 6);
                setPincodeInput(v);
                if (v.length < 6) setLocationFilter("");
              }} 
              className="pl-10 rounded-xl h-11 bg-primary/5 border-primary/20 focus-visible:ring-primary/30 font-medium" 
              maxLength={6}
            />
          </div>
        </div>
        {pincodeLoading && <p className="text-xs text-primary animate-pulse mt-2">🔍 Looking up pincode...</p>}
        {pincodeData && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3 p-2.5 rounded-xl bg-primary/5 border border-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm text-foreground font-medium">
              {pincodeData.area}, {pincodeData.city}
            </span>
            <span className="text-xs text-muted-foreground">
              {pincodeData.district}, {pincodeData.state}
            </span>
            <Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{pincodeData.pincode}</Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Area Pills */}
      {areas.length > 0 && (
        <motion.div variants={item} className="flex flex-wrap gap-2">
          <button onClick={() => { setLocationFilter(""); setPincodeInput(""); }}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              !locationFilter ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground hover:bg-muted/80"
            }`}>All Areas</button>
          {areas.slice(0, 8).map(a => (
            <button key={a} onClick={() => setLocationFilter(a)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                locationFilter === a ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground hover:bg-muted/80"
              }`}>{a}</button>
          ))}
        </motion.div>
      )}

      {/* Results */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Finding suppliers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No suppliers found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different pincode or search term.</p>
        </div>
      ) : (
        <>
          <motion.p variants={item} className="text-xs text-muted-foreground font-medium">
            Showing {filtered.length} supplier{filtered.length !== 1 ? "s" : ""}
          </motion.p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((s, i) => (
              <motion.div key={s.id} variants={item}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                className={`glass-card rounded-2xl overflow-hidden hover:shadow-2xl hover:shadow-primary/10 transition-all duration-300 group ${!s.available ? "opacity-50 pointer-events-none" : ""}`}>
                
                {/* Card Header with gradient */}
                <div className="relative h-20 bg-gradient-to-br from-primary/10 via-accent/5 to-transparent p-4">
                  <div className="flex items-start justify-between">
                    <div className="h-14 w-14 rounded-2xl bg-card shadow-lg flex items-center justify-center text-2xl border border-border/50">
                      🚛
                    </div>
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

                {/* Card Body */}
                <div className="p-4 pt-2 space-y-3">
                  <div>
                    <h3 className="font-heading font-bold text-base group-hover:text-primary transition-colors">{s.business_name}</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="flex items-center gap-0.5">
                        <Star className="h-3.5 w-3.5 fill-warning text-warning" />
                        <span className="text-sm font-bold">{Number(s.rating).toFixed(1)}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">({s.review_count} reviews)</span>
                      {Number(s.rating) >= 4.5 && (
                        <Badge className="bg-warning/10 text-warning border-0 text-[9px] px-1.5">TOP RATED</Badge>
                      )}
                    </div>
                  </div>

                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <div className="flex items-center gap-2"><MapPin className="h-3 w-3 text-primary/60 shrink-0" /> {s.area}</div>
                    <div className="flex items-center gap-2"><Droplets className="h-3 w-3 text-primary/60 shrink-0" /> {s.water_type}</div>
                    <div className="flex items-center gap-2"><Clock className="h-3 w-3 text-primary/60 shrink-0" /> {s.delivery_time} · {s.stock} cans</div>
                  </div>

                  {/* Pricing Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-2.5 text-center">
                      <ShoppingCart className="h-3.5 w-3.5 text-primary mx-auto mb-1" />
                      <p className="font-heading font-bold text-primary text-lg leading-none">₹{Number(s.price_per_can)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">per can</p>
                    </div>
                    <div className="rounded-xl bg-accent/5 border border-accent/10 p-2.5 text-center">
                      <TruckIcon className="h-3.5 w-3.5 text-accent mx-auto mb-1" />
                      <p className="font-heading font-bold text-accent text-lg leading-none">₹{Number((s as any).price_per_tanker || 500)}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">per tanker</p>
                    </div>
                  </div>

                  {/* CTA Buttons */}
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
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
