import { useEffect, useMemo, useState } from "react";
import { Clock, Droplets, Locate, MapPin, Navigation, Plus, Search, Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCart } from "@/hooks/use-cart";
import { usePincode } from "@/hooks/use-pincode";
import { estimateDeliveryTime } from "@/lib/delivery-estimate";
import { getProductImageUrl } from "@/lib/product-images";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useLocation, calculateDistance } from "@/hooks/use-location";

const categories = [
  { key: "all", label: "All Products" },
  { key: "bottle", label: "Bottles" },
  { key: "can", label: "Cans" },
  { key: "jar", label: "Jars" },
  { key: "tanker", label: "Tankers" },
];

export default function ProductCatalog() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [pincodeInput, setPincodeInput] = useState("");
  const { addToCart } = useCart();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();
  const { toast } = useToast();
  const { location: userCoords, loading: locationLoading, refreshLocation } = useLocation();

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
        .select(`
          *, 
          suppliers(id, business_name, area, pincode, rating, review_count, available, blocked, latitude, longitude)
        `)
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
    refreshLocation();
  };

  // Auto-fill pincode from GPS coordinates if available
  useEffect(() => {
    if (userCoords && pincodeInput === "") {
      const fetchPincode = async () => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${userCoords.lat}&lon=${userCoords.lng}&format=json&addressdetails=1`
          );
          const data = await res.json();
          const postcode = data.address?.postcode;
          if (postcode && postcode.length === 6) {
            setPincodeInput(postcode);
          }
        } catch (e) {
          console.error("Reverse geocoding failed", e);
        }
      };
      fetchPincode();
    }
  }, [userCoords]);

  const { nearbyProducts, otherProducts } = useMemo(() => {
    let list = products.filter(p => {
      const supplier = p.suppliers;
      return supplier && !supplier.blocked && supplier.available;
    });

    if (category !== "all") list = list.filter(p => p.category === category);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || p.suppliers?.business_name?.toLowerCase().includes(q));
    }

    const seenProducts = new Set<string>();
    list = list.filter(p => {
      const key = `${p.supplier_id}-${p.category}-${Number(p.size_liters)}`;
      if (seenProducts.has(key)) return false;
      seenProducts.add(key);
      return true;
    });

    list = list.map(p => {
      const supplier = p.suppliers;
      let dist = null;

      // Real coordinates take precedence
      if (userCoords && supplier.latitude && supplier.longitude) {
        dist = calculateDistance(userCoords.lat, userCoords.lng, supplier.latitude, supplier.longitude);
      } else if (pincodeInput.length === 6) {
        // Fallback to pincode heuristic
        const { distanceKm } = estimateDeliveryTime(supplier.pincode, pincodeInput);
        dist = distanceKm;
      }
      
      return { ...p, distanceKm: dist };
    });

    const serving: any[] = [];
    const other: any[] = [];

    // Filter by serviceability
    const pincodePrefix = pincodeInput.slice(0, 3);
    const cityLower = pincodeData?.city?.toLowerCase() || "";
    const areaLower = pincodeData?.area?.toLowerCase() || "";

    const servicingSupplierIds = new Set(
      serviceAreas
        .filter(sa => {
          if (pincodeInput && sa.pincode === pincodeInput) return true;
          if (pincodeInput && sa.pincode?.slice(0, 3) === pincodePrefix) return true;
          const saCity = sa.city?.toLowerCase() || "";
          const saArea = sa.area_name?.toLowerCase() || "";
          return (saCity && cityLower && (saCity.includes(cityLower) || cityLower.includes(saCity))) ||
            (saArea && areaLower && saArea.includes(areaLower));
        })
        .map(sa => sa.supplier_id),
    );

    list.forEach(p => {
      const supplier = p.suppliers;
      const exactPincode = pincodeInput && supplier.pincode === pincodeInput;
      const hasServiceArea = servicingSupplierIds.has(supplier.id);
      const isClose = p.distanceKm !== null && p.distanceKm < 5;

      if (exactPincode || hasServiceArea || isClose || (!pincodeInput && !userCoords)) {
        serving.push(p);
      } else {
        other.push(p);
      }
    });

    serving.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));

    return { nearbyProducts: serving, otherProducts: other };
  }, [products, serviceAreas, pincodeData, pincodeInput, userCoords, category, search]);

  const hasPincode = (pincodeInput.length === 6 && pincodeData) || userCoords;
  const totalResults = nearbyProducts.length + otherProducts.length;

  const renderProduct = (product: any) => {
    const eta = pincodeInput.length === 6 ? estimateDeliveryTime(product.suppliers?.pincode, pincodeInput) : null;
    const inStock = product.stock > 0;
    const imageUrl = getProductImageUrl(product);

    return (
      <div key={product.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 hover:shadow-sm transition-all flex flex-col">
        <div className="relative h-36 bg-gradient-to-br from-muted to-muted/50 flex items-center justify-center overflow-hidden">
          <img src={imageUrl} alt={product.name} className="h-full w-full object-contain p-2" />
          <span className="absolute top-2 left-2 bg-card/90 backdrop-blur-sm text-xs font-medium px-2 py-0.5 rounded-md border border-border">
            {Number(product.size_liters)}L
          </span>
          <span className={`absolute top-2 right-2 text-[10px] font-medium px-2 py-0.5 rounded-md ${
            !inStock
              ? "bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400"
              : product.stock < 10
                ? "bg-amber-50 text-amber-600 dark:bg-red-900/20 dark:text-red-400"
                : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400"
          }`}>
            {!inStock ? "Out of stock" : product.stock < 10 ? `${product.stock} left` : "In stock"}
          </span>
        </div>

        <div className="p-3 flex-1 flex flex-col">
          <h4 className="font-medium text-sm line-clamp-1">{product.name}</h4>
          <p className="text-xs text-muted-foreground truncate mt-0.5">{product.suppliers?.business_name}</p>

          <div className="flex items-center gap-2 text-xs mt-2">
            <div className="flex items-center gap-0.5">
              <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
              <span className="font-medium">{Number(product.suppliers?.rating || 0).toFixed(1)}</span>
            </div>
            {product.suppliers?.area && (
              <span className="text-muted-foreground truncate flex items-center gap-0.5">
                <MapPin className="h-3 w-3 shrink-0" />
                {product.suppliers.area.split(",")[0]}
              </span>
            )}
          </div>

          {(product.distanceKm !== null || eta) && (
            <div className="flex flex-col gap-1 mt-1.5">
              <div className="flex items-center gap-1 text-xs text-primary">
                <Clock className="h-3 w-3" />
                <span className="font-medium">{eta?.label || "Fast Delivery"}</span>
              </div>
              {product.distanceKm !== null && (
                <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <Navigation className="h-2.5 w-2.5" />
                  <span>{product.distanceKm.toFixed(1)} KM away</span>
                </div>
              )}
            </div>
          )}

          <div className="flex-1" />

          <div className="flex items-end justify-between pt-3 mt-2 border-t border-border">
            <div>
              <p className="text-[10px] text-muted-foreground">Price</p>
              <p className="font-semibold text-primary text-lg leading-none">Rs. {Number(product.price)}</p>
            </div>
            <Button
              size="sm"
              className="rounded-lg h-8 px-3 text-xs gap-1"
              disabled={!inStock}
              onClick={() => addToCart.mutate({ productId: product.id, supplierId: product.supplier_id })}
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 py-2">
      <div>
        <h1 className="text-2xl font-semibold">Products</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {hasPincode && nearbyProducts.length > 0
            ? `${nearbyProducts.length} product${nearbyProducts.length !== 1 ? "s" : ""} near you`
            : `Browse ${totalResults}+ products from verified suppliers`}
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products, suppliers..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-lg h-10 bg-muted/50 border-0 text-sm"
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-40">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pincode"
                value={pincodeInput}
                onChange={e => setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="pl-9 rounded-lg h-10 text-sm font-medium"
                maxLength={6}
              />
            </div>
            <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg shrink-0" onClick={handleGPS} disabled={locationLoading}>
              <Locate className={`h-4 w-4 ${locationLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>
        </div>
        {(pincodeLoading || locationLoading) && (
          <p className="text-xs text-primary flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            Finding suppliers near you...
          </p>
        )}
        {pincodeData && !locationLoading && (
          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-primary/5 border border-primary/10">
            <MapPin className="h-3.5 w-3.5 text-primary shrink-0" />
            <span className="text-sm font-medium flex-1">{pincodeData.area}, {pincodeData.city}</span>
            <Badge variant="secondary" className="text-xs font-medium">{pincodeData.pincode}</Badge>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {categories.map(c => {
          const active = category === c.key;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className={`flex items-center px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all shrink-0 ${
                active
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-foreground/20"
              }`}
            >
              {c.label}
            </button>
          );
        })}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl overflow-hidden animate-pulse">
              <div className="h-36 bg-muted" />
              <div className="p-3 space-y-2">
                <div className="h-3 bg-muted rounded w-3/4" />
                <div className="h-2.5 bg-muted rounded w-1/2" />
                <div className="h-5 bg-muted rounded w-1/3 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : totalResults === 0 ? (
        <div className="text-center py-16 bg-card border border-border rounded-xl">
          <Droplets className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-semibold text-lg">No products found</p>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs mx-auto">
            {search ? "Try a different search term or category" : "No products available in this category yet"}
          </p>
          {(search || category !== "all") && (
            <Button variant="outline" size="sm" className="mt-4 rounded-lg" onClick={() => { setSearch(""); setCategory("all"); }}>
              Clear filters
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-8">
          {nearbyProducts.length > 0 && (
            <div>
              {hasPincode && otherProducts.length > 0 && (
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold">Near You</h3>
                  <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20 text-[10px]">Distance Sorted</Badge>
                  <span className="text-xs text-muted-foreground ml-1">
                    {nearbyProducts.length} product{nearbyProducts.length !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {nearbyProducts.map(renderProduct)}
              </div>
            </div>
          )}

          {otherProducts.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-4">
                <h3 className="font-semibold text-muted-foreground">Other Areas</h3>
                <span className="text-xs text-muted-foreground">
                  {otherProducts.length} product{otherProducts.length !== 1 ? "s" : ""}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 opacity-75">
                {otherProducts.map(renderProduct)}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
