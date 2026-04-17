import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Navigation, Plus, Droplets, Star, Clock, Locate, Truck, Sparkles, Zap, Shield, TrendingUp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { usePincode } from "@/hooks/use-pincode";
import { estimateDeliveryTime } from "@/lib/delivery-estimate";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const categories = [
  { key: "all", label: "All Products", icon: "💧", gradient: "from-primary to-blue-600" },
  { key: "bottle", label: "Bottles", icon: "🍶", gradient: "from-blue-500 to-cyan-500" },
  { key: "can", label: "Cans", icon: "🪣", gradient: "from-emerald-500 to-teal-500" },
  { key: "jar", label: "Jars", icon: "🫙", gradient: "from-violet-500 to-purple-500" },
  { key: "tanker", label: "Tankers", icon: "🚛", gradient: "from-amber-500 to-orange-500" },
];

const catGradient = (cat: string) =>
  cat === "bottle" ? "from-blue-500/30 via-cyan-400/15 to-transparent" :
  cat === "tanker" ? "from-amber-500/30 via-orange-400/15 to-transparent" :
  cat === "jar" ? "from-violet-500/30 via-purple-400/15 to-transparent" :
  "from-emerald-500/30 via-teal-400/15 to-transparent";

const catIcon = (cat: string) =>
  cat === "bottle" ? "🍶" : cat === "tanker" ? "🚛" : cat === "jar" ? "🫙" : "🪣";

export default function ProductCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [pincodeInput, setPincodeInput] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const { addToCart } = useCart();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();
  const { toast } = useToast();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const cat = params.get("cat");
    if (cat && categories.some(c => c.key === cat)) setCategory(cat);
  }, []);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products-catalog"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*, suppliers(id, business_name, area, pincode, rating, review_count, available, blocked)")
        .eq("active", true)
        .order("price", { ascending: true });
      if (error) throw error;
      return data as any[];
    },
  });

  const { data: serviceAreas = [] } = useQuery({
    queryKey: ["all-service-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("supplier_service_areas")
        .select("supplier_id, pincode, area_name, city")
        .eq("active", true);
      if (error) throw error;
      return data as any[];
    },
  });

  useEffect(() => {
    if (pincodeInput.length === 6) lookup(pincodeInput);
  }, [pincodeInput, lookup]);

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
            setPincodeInput(postcode);
            toast({ title: "📍 Location detected!", description: `Pincode: ${postcode}` });
          } else {
            toast({ title: "Could not detect pincode", description: "Please enter manually" });
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

  const { nearbyProducts, otherProducts } = useMemo(() => {
    let list = products.filter(p => {
      const s = p.suppliers;
      return s && !s.blocked && s.available;
    });

    if (category !== "all") list = list.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.suppliers?.business_name?.toLowerCase().includes(q));
    }

    if (!pincodeData || pincodeInput.length !== 6) {
      return { nearbyProducts: list, otherProducts: [] as any[] };
    }

    const pincodePrefix = pincodeInput.slice(0, 3);
    const districtLower = pincodeData.district?.toLowerCase() || "";
    const cityLower = pincodeData.city?.toLowerCase() || "";
    const areaLower = pincodeData.area?.toLowerCase() || "";

    const servicingSupplierIds = new Set(
      serviceAreas
        .filter(sa => {
          if (sa.pincode === pincodeInput) return true;
          if (sa.pincode?.slice(0, 3) === pincodePrefix) return true;
          const saCity = sa.city?.toLowerCase() || "";
          const saArea = sa.area_name?.toLowerCase() || "";
          return saCity.includes(cityLower) || saArea.includes(areaLower) ||
            cityLower.includes(saCity) || districtLower.includes(saCity);
        })
        .map(sa => sa.supplier_id)
    );

    const nearby: any[] = [];
    const other: any[] = [];

    list.forEach(p => {
      const sup = p.suppliers;
      const supPincode = sup.pincode || "";
      const supArea = sup.area?.toLowerCase() || "";
      const isNearby =
        supPincode === pincodeInput ||
        supPincode.slice(0, 3) === pincodePrefix ||
        servicingSupplierIds.has(sup.id) ||
        supArea.includes(districtLower) ||
        supArea.includes(cityLower) ||
        districtLower.includes(supArea.split(",")[0]?.trim() || "");
      if (isNearby) nearby.push(p);
      else other.push(p);
    });

    return { nearbyProducts: nearby, otherProducts: other };
  }, [products, serviceAreas, pincodeData, pincodeInput, category, search]);

  const hasPincode = pincodeInput.length === 6 && pincodeData;
  const totalResults = nearbyProducts.length + otherProducts.length;

  const renderProduct = (p: any) => {
    const eta = hasPincode ? estimateDeliveryTime(p.suppliers?.pincode, pincodeInput) : null;
    const inStock = p.stock > 0;
    return (
      <motion.div key={p.id} variants={item}
        whileHover={{ y: -6, transition: { duration: 0.2 } }}
        className="group relative">
        {/* Glow effect on hover */}
        <div className="absolute -inset-0.5 bg-gradient-to-br from-primary/40 via-accent/30 to-primary/40 rounded-3xl opacity-0 group-hover:opacity-100 blur-md transition-opacity duration-300" />
        
        <div className="relative glass-card rounded-3xl overflow-hidden h-full flex flex-col">
          {/* Image area with rich gradient */}
          <div className={`relative h-40 bg-gradient-to-br ${catGradient(p.category)} flex items-center justify-center overflow-hidden`}>
            {/* Decorative bubbles */}
            <div className="absolute top-3 right-6 h-8 w-8 rounded-full bg-white/30 blur-sm" />
            <div className="absolute bottom-4 left-4 h-12 w-12 rounded-full bg-white/20 blur-md" />
            <div className="absolute top-1/2 left-1/3 h-6 w-6 rounded-full bg-white/25 blur-sm" />
            
            {p.image_url ? (
              <img src={p.image_url} alt={p.name} className="relative h-full w-full object-cover" />
            ) : (
              <motion.span 
                className="relative text-6xl drop-shadow-lg"
                whileHover={{ scale: 1.15, rotate: -5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                {catIcon(p.category)}
              </motion.span>
            )}
            
            {/* Size badge - top left */}
            <Badge className="absolute top-3 left-3 bg-card/90 backdrop-blur-md text-foreground border-0 font-bold text-xs px-2.5 py-1 shadow-md">
              {Number(p.size_liters)}L
            </Badge>
            
            {/* Stock status - top right */}
            {!inStock ? (
              <Badge variant="destructive" className="absolute top-3 right-3 text-[10px] shadow-md">Out of stock</Badge>
            ) : p.stock < 10 ? (
              <Badge className="absolute top-3 right-3 bg-warning/90 text-warning-foreground border-0 text-[10px] shadow-md gap-1">
                <Zap className="h-2.5 w-2.5" /> Only {p.stock} left
              </Badge>
            ) : (
              <Badge className="absolute top-3 right-3 bg-success/90 text-success-foreground border-0 text-[10px] shadow-md">
                In stock
              </Badge>
            )}
          </div>
          
          {/* Content */}
          <div className="p-4 space-y-2.5 flex-1 flex flex-col">
            <div>
              <h4 className="font-heading font-bold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {p.name}
              </h4>
              <p className="text-[11px] text-muted-foreground truncate mt-0.5">{p.suppliers?.business_name}</p>
            </div>

            {/* Rating + Location row */}
            <div className="flex items-center gap-2 text-[11px]">
              <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-warning/10">
                <Star className="h-3 w-3 fill-warning text-warning" />
                <span className="font-bold text-warning-foreground">{Number(p.suppliers?.rating || 0).toFixed(1)}</span>
              </div>
              {p.suppliers?.area && (
                <div className="flex items-center gap-0.5 text-muted-foreground min-w-0">
                  <MapPin className="h-3 w-3 text-primary/60 shrink-0" />
                  <span className="truncate">{p.suppliers.area.split(",")[0]}</span>
                </div>
              )}
            </div>

            {/* ETA */}
            {eta && (
              <div className="flex items-center gap-1.5 text-[11px] px-2 py-1 rounded-lg bg-primary/8 border border-primary/15 w-fit">
                <Clock className="h-3 w-3 text-primary" />
                <span className="text-primary font-bold">{eta.label}</span>
              </div>
            )}

            {/* Spacer */}
            <div className="flex-1" />

            {/* Price + Add row */}
            <div className="flex items-end justify-between pt-2 border-t border-border/50">
              <div>
                <p className="text-[10px] text-muted-foreground font-medium">Price</p>
                <p className="font-heading font-bold text-primary text-xl leading-none">₹{Number(p.price)}</p>
              </div>
              <Button size="sm" className="rounded-xl h-9 px-3.5 text-xs gap-1 shadow-md hover:shadow-lg hover:scale-105 transition-all"
                disabled={!inStock}
                onClick={() => addToCart.mutate({ productId: p.id, supplierId: p.supplier_id })}>
                <Plus className="h-3.5 w-3.5" /> Add
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* HERO HEADER */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-accent p-6 sm:p-8 text-primary-foreground">
        {/* Decorative blobs */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 h-48 w-48 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute bottom-0 left-1/4 h-40 w-40 rounded-full bg-accent/40 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
        </div>
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold mb-3">
              <Sparkles className="h-3 w-3" /> Fresh Water Marketplace
            </div>
            <h2 className="font-heading text-2xl sm:text-4xl font-bold leading-tight">
              Pure Water,<br className="sm:hidden"/> Delivered Fast 💧
            </h2>
            <p className="text-sm sm:text-base text-white/85 mt-2 max-w-md">
              {hasPincode
                ? `${nearbyProducts.length} product${nearbyProducts.length !== 1 ? "s" : ""} near ${pincodeData.area}, ${pincodeData.district}`
                : `Browse ${totalResults}+ products from verified suppliers`}
            </p>
          </div>
          {/* Floating stats card */}
          <div className="hidden sm:flex flex-col gap-2 bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 min-w-[140px]">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs font-semibold">Live Stock</span>
            </div>
            <p className="text-2xl font-heading font-bold">{totalResults}</p>
            <p className="text-[10px] text-white/70">products available</p>
          </div>
        </div>
      </motion.div>

      {/* SEARCH + LOCATION BAR */}
      <motion.div variants={item} className="glass-card rounded-3xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products, suppliers, brands..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-11 rounded-2xl h-12 bg-muted/40 border-0 focus-visible:ring-2 focus-visible:ring-primary/40 text-sm font-medium" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 lg:w-52">
              <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input placeholder="Enter pincode" value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-11 rounded-2xl h-12 bg-primary/5 border-2 border-primary/20 font-bold focus-visible:border-primary/50" maxLength={6} />
            </div>
            <Button variant="default" size="icon" 
              className="h-12 w-12 rounded-2xl shrink-0 bg-gradient-to-br from-primary to-blue-600 hover:scale-105 transition-transform shadow-md"
              onClick={handleGPS} disabled={gpsLoading}>
              <Locate className={`h-4 w-4 ${gpsLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {pincodeLoading && (
          <div className="flex items-center gap-2 mt-3 text-xs text-primary">
            <div className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <span className="font-medium">Finding suppliers near you...</span>
          </div>
        )}
        {pincodeData && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2 mt-3 p-3 rounded-2xl bg-gradient-to-r from-primary/10 via-accent/10 to-transparent border border-primary/20">
            <div className="h-8 w-8 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <MapPin className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{pincodeData.area}, {pincodeData.city}</p>
              <p className="text-[11px] text-muted-foreground">{pincodeData.district}, {pincodeData.state}</p>
            </div>
            <Badge className="bg-primary/15 text-primary border-0 text-xs font-bold px-2.5">{pincodeData.pincode}</Badge>
          </motion.div>
        )}
      </motion.div>

      {/* CATEGORY PILLS - richer design */}
      <motion.div variants={item}>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
          {categories.map(c => {
            const active = category === c.key;
            return (
              <motion.button key={c.key} onClick={() => setCategory(c.key)}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-2xl text-sm font-bold whitespace-nowrap transition-all shrink-0 ${
                  active 
                    ? `bg-gradient-to-br ${c.gradient} text-white shadow-lg shadow-primary/30` 
                    : "glass-card text-muted-foreground hover:text-foreground hover:scale-105"
                }`}>
                <span className="text-lg">{c.icon}</span>
                {c.label}
                {active && (
                  <motion.div layoutId="cat-dot" className="h-1.5 w-1.5 rounded-full bg-white" />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>

      {/* TRUST STRIP */}
      {!hasPincode && (
        <motion.div variants={item} className="grid grid-cols-3 gap-2 sm:gap-3">
          {[
            { icon: Shield, label: "Verified", desc: "All suppliers", color: "text-emerald-500", bg: "bg-emerald-500/10" },
            { icon: Zap, label: "30 Min", desc: "Avg delivery", color: "text-amber-500", bg: "bg-amber-500/10" },
            { icon: Star, label: "4.5+ Rated", desc: "Top quality", color: "text-violet-500", bg: "bg-violet-500/10" },
          ].map(b => (
            <div key={b.label} className="glass-card rounded-2xl p-3 flex items-center gap-2.5">
              <div className={`h-9 w-9 rounded-xl ${b.bg} flex items-center justify-center shrink-0`}>
                <b.icon className={`h-4 w-4 ${b.color}`} />
              </div>
              <div className="min-w-0">
                <p className="font-heading font-bold text-xs sm:text-sm">{b.label}</p>
                <p className="text-[10px] text-muted-foreground truncate">{b.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      )}

      {/* PRODUCTS GRID */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="glass-card rounded-3xl overflow-hidden animate-pulse">
              <div className="h-40 bg-muted/40" />
              <div className="p-4 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2 bg-muted rounded w-1/2" />
                <div className="h-6 bg-muted rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : totalResults === 0 ? (
        <motion.div variants={item} className="text-center py-16 glass-card rounded-3xl">
          <div className="h-20 w-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-primary/40" />
          </div>
          <p className="font-heading font-bold text-lg">No products found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {search ? "Try a different search term or category" : "No products available in this category yet"}
          </p>
          {(search || category !== "all") && (
            <Button variant="outline" size="sm" className="mt-4 rounded-xl"
              onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear filters
            </Button>
          )}
        </motion.div>
      ) : (
        <div className="space-y-8">
          {/* NEARBY SECTION */}
          {nearbyProducts.length > 0 && (
            <motion.div variants={item}>
              {hasPincode && otherProducts.length > 0 && (
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-success to-emerald-600 flex items-center justify-center shadow-md">
                    <MapPin className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-heading font-bold text-base sm:text-lg">Near You</h3>
                    <p className="text-[11px] text-muted-foreground">
                      {nearbyProducts.length} product{nearbyProducts.length !== 1 ? "s" : ""} in {pincodeData.district}
                    </p>
                  </div>
                  <Badge className="ml-auto bg-success/10 text-success border-success/20 font-bold">Fast delivery</Badge>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
                {nearbyProducts.map(renderProduct)}
              </div>
            </motion.div>
          )}

          {/* Other products */}
          {otherProducts.length > 0 && (
            <motion.div variants={item}>
              <div className="flex items-center gap-3 mb-4">
                <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center">
                  <Truck className="h-4 w-4 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-base sm:text-lg text-muted-foreground">Other Areas</h3>
                  <p className="text-[11px] text-muted-foreground">{otherProducts.length} product{otherProducts.length !== 1 ? "s" : ""} · longer delivery time</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 opacity-80">
                {otherProducts.map(renderProduct)}
              </div>
            </motion.div>
          )}
        </div>
      )}
    </motion.div>
  );
}
