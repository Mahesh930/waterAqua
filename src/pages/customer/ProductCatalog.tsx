import { useState, useMemo, useEffect } from "react";
import { Search, MapPin, Navigation, ShoppingCart, Plus, Filter, Droplets, Star, Clock, Locate, Truck, Badge as BadgeIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/hooks/use-cart";
import { usePincode } from "@/hooks/use-pincode";
import { estimateDeliveryTime } from "@/lib/delivery-estimate";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const categories = [
  { key: "all", label: "All", icon: "💧" },
  { key: "bottle", label: "Bottles", icon: "🍶" },
  { key: "can", label: "Cans", icon: "🪣" },
  { key: "jar", label: "Jars", icon: "🫙" },
  { key: "tanker", label: "Tankers", icon: "🚛" },
];

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

  // Read category from URL params
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

  // Fetch all service areas for filtering
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

  // GPS auto-detect
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

    // Apply category & search filters
    if (category !== "all") list = list.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.suppliers?.business_name?.toLowerCase().includes(q));
    }

    // If no pincode, show all products
    if (!pincodeData || pincodeInput.length !== 6) {
      return { nearbyProducts: list, otherProducts: [] as any[] };
    }

    // District-level matching: pincode prefix (first 3 digits = district), service areas, area text
    const pincodePrefix = pincodeInput.slice(0, 3); // Same district
    const districtLower = pincodeData.district?.toLowerCase() || "";
    const cityLower = pincodeData.city?.toLowerCase() || "";
    const areaLower = pincodeData.area?.toLowerCase() || "";

    // Build set of supplier IDs that service this area
    const servicingSupplierIds = new Set(
      serviceAreas
        .filter(sa => {
          // Exact pincode match
          if (sa.pincode === pincodeInput) return true;
          // Same district (first 3 digits)
          if (sa.pincode?.slice(0, 3) === pincodePrefix) return true;
          // City/area text match
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

      // Check if supplier is nearby
      const isNearby =
        supPincode === pincodeInput || // Exact pincode
        supPincode.slice(0, 3) === pincodePrefix || // Same district
        servicingSupplierIds.has(sup.id) || // Has service area in this district
        supArea.includes(districtLower) || // Area text matches district
        supArea.includes(cityLower) || // Area text matches city
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
    return (
      <motion.div key={p.id} variants={item}
        whileHover={{ y: -4, transition: { duration: 0.2 } }}
        className="glass-card rounded-2xl overflow-hidden group">
        {/* Product image */}
        <div className="relative h-32 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent flex items-center justify-center">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
          ) : (
            <span className="text-5xl drop-shadow-sm">{catIcon(p.category)}</span>
          )}
          <Badge className="absolute top-2 left-2 bg-card/80 backdrop-blur text-[10px] border-0 font-bold">
            {Number(p.size_liters)}L
          </Badge>
          {p.stock <= 0 && (
            <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Out of stock</Badge>
          )}
        </div>
        <div className="p-3.5 space-y-2">
          <h4 className="font-heading font-semibold text-sm leading-tight group-hover:text-primary transition-colors line-clamp-1">{p.name}</h4>
          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span className="font-semibold">{Number(p.suppliers?.rating || 0).toFixed(1)}</span>
            <span className="truncate">· {p.suppliers?.business_name}</span>
          </div>
          {p.suppliers?.area && (
            <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 text-primary/50 shrink-0" />
              <span className="truncate">{p.suppliers.area}</span>
            </div>
          )}
          {eta && (
            <div className="flex items-center gap-1 text-[11px]">
              <Clock className="h-3 w-3 text-primary/60" />
              <span className="text-primary font-semibold">{eta.label}</span>
            </div>
          )}
          <div className="flex items-center justify-between pt-1">
            <p className="font-heading font-bold text-primary text-lg">₹{Number(p.price)}</p>
            <Button size="sm" className="rounded-xl h-8 px-3 text-xs gap-1 shadow-sm"
              disabled={p.stock <= 0}
              onClick={() => addToCart.mutate({ productId: p.id, supplierId: p.supplier_id })}>
              <Plus className="h-3 w-3" /> Add
            </Button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold">Water Products</h2>
        <p className="text-sm text-muted-foreground mt-0.5">
          {hasPincode
            ? `${nearbyProducts.length} product${nearbyProducts.length !== 1 ? "s" : ""} near ${pincodeData.area}, ${pincodeData.district}`
            : `${totalResults} products available · Enter pincode for nearby results`}
        </p>
      </motion.div>

      {/* Location bar */}
      <motion.div variants={item} className="glass-card rounded-2xl p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search products or suppliers..." value={search} onChange={e => setSearch(e.target.value)}
              className="pl-10 rounded-xl h-11 bg-muted/30 border-0 focus-visible:ring-primary/30" />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-44">
              <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
              <Input placeholder="Pincode" value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-10 rounded-xl h-11 bg-primary/5 border-primary/20 font-medium" maxLength={6} />
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
            <span className="text-sm font-medium">{pincodeData.area}, {pincodeData.city}</span>
            <span className="text-xs text-muted-foreground">{pincodeData.district}, {pincodeData.state}</span>
            <Badge className="ml-auto bg-primary/10 text-primary border-0 text-[10px]">{pincodeData.pincode}</Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Category pills */}
      <motion.div variants={item} className="flex gap-2 overflow-x-auto pb-1">
        {categories.map(c => (
          <button key={c.key} onClick={() => setCategory(c.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              category === c.key ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            <span>{c.icon}</span> {c.label}
          </button>
        ))}
      </motion.div>

      {/* Products grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Droplets className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No products found</p>
          <p className="text-sm text-muted-foreground mt-1">
            {search ? "Try a different search term" : "No products available in this category"}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Nearby products */}
          {nearbyProducts.length > 0 && (
            <div>
              {hasPincode && otherProducts.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-6 w-6 rounded-lg bg-success/10 flex items-center justify-center">
                    <MapPin className="h-3 w-3 text-success" />
                  </div>
                  <h3 className="font-heading font-semibold text-sm">
                    Near {pincodeData.district} · {nearbyProducts.length} product{nearbyProducts.length !== 1 ? "s" : ""}
                  </h3>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {nearbyProducts.map(renderProduct)}
              </div>
            </div>
          )}

          {/* Other products */}
          {otherProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className="h-6 w-6 rounded-lg bg-muted flex items-center justify-center">
                  <Truck className="h-3 w-3 text-muted-foreground" />
                </div>
                <h3 className="font-heading font-semibold text-sm text-muted-foreground">
                  Other areas · {otherProducts.length} product{otherProducts.length !== 1 ? "s" : ""}
                </h3>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-75">
                {otherProducts.map(renderProduct)}
              </div>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
