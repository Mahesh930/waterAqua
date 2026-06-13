import React, { useState, useEffect, useMemo } from "react";
import { Star, MapPin, Clock, Droplets, Search, Navigation, ShoppingCart, Truck as TruckIcon, Locate, ChevronRight, ChevronLeft } from "lucide-react";
import { Input } from "@/ui/input";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/shared/hooks/use-toast";
import { useGetSuppliersQuery } from "@/store/api";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const [pincodeInput, setPincodeInput] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState("rating");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [detectedArea, setDetectedArea] = useState(null);
  
  const navigate = useNavigate();
  const { toast } = useToast();

  // RTK Query hooks
  const { data: responseData = {}, isLoading } = useGetSuppliersQuery({
    pincode: pincodeInput.length === 6 ? pincodeInput : undefined,
    search: search || undefined,
    page,
    limit: 6 // 6 suppliers per page
  });

  const suppliers = responseData.results || [];
  const pagination = responseData.pagination || { page: 1, pages: 1, total: 0 };

  const handleGPS = () => {
    if (!navigator.geolocation) { 
      toast({ title: "GPS not supported", variant: "destructive" }); 
      return; 
    }
    
    setGpsLoading(true);
    setDetectedArea(null);
    setPincodeInput("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&addressdetails=1&zoom=18`);
          const data = await res.json();
          let postcode = data.address?.postcode;
          
          if (!postcode) {
             const match = data.display_name?.match(/\b\d{6}\b/);
             if (match) postcode = match[0];
          }

          if (postcode) {
             const cleanPostcode = String(postcode).replace(/\s+/g, '');
             if (cleanPostcode.length >= 6) {
                const finalPincode = cleanPostcode.slice(0, 6);
                setPincodeInput(finalPincode);
                setDetectedArea({
                  pincode: finalPincode,
                  area: data.address?.suburb || data.address?.neighbourhood || data.address?.city_district || "Detected Area",
                  city: data.address?.city || data.address?.town || "City"
                });
                toast({ title: "Location detected", description: `Matched pincode ${finalPincode}` });
             } else {
                toast({ title: "Could not detect pincode", description: "Please enter manually" });
             }
          } else {
             toast({ title: "Could not detect pincode", description: "Please enter manually" });
          }
        } catch (e) { 
          toast({ title: "Location lookup failed", variant: "destructive" }); 
        } finally {
          setGpsLoading(false);
        }
      },
      () => { 
        toast({ title: "Location access denied", variant: "destructive" }); 
        setGpsLoading(false); 
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Sort supplier list dynamically
  const sortedSuppliers = useMemo(() => {
    return [...suppliers].sort((a, b) => {
      if (sortBy === "deliveryCharge") return Number(a.deliveryCharge) - Number(b.deliveryCharge);
      if (sortBy === "name") return a.businessName.localeCompare(b.businessName);
      return Number(b.rating) - Number(a.rating);
    });
  }, [suppliers, sortBy]);

  const showResults = pincodeInput.length === 6 || search.trim().length > 0;
  const hasPincode = pincodeInput.length === 6;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">Browse Suppliers</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {hasPincode
              ? `${sortedSuppliers.length} active water suppliers in ${detectedArea ? detectedArea.area : pincodeInput}`
              : search.trim().length > 0
                ? `Found ${sortedSuppliers.length} suppliers matching "${search}"`
                : "Enter your 6-digit delivery pincode to discover local water distributors"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {[
            { key: "rating", label: "⭐ Rating" },
            { key: "deliveryCharge", label: "💰 Delivery Fee" },
            { key: "name", label: "🔤 Name" }
          ].map(s => (
            <button 
              key={s.key} 
              onClick={() => setSortBy(s.key)}
              className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition-all ${
                sortBy === s.key 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                  : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Search & Pincode controls */}
      <motion.div variants={item} className="p-4 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
              placeholder="Search by brand name or description..." 
              value={search} 
              onChange={e => { setSearch(e.target.value); setPage(1); }} 
              className="pl-10 rounded-xl h-11 bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
            />
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1 sm:w-44">
              <Navigation className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-blue-400" />
              <Input 
                placeholder="Pincode" 
                value={pincodeInput} 
                onChange={e => { setPincodeInput(e.target.value.replace(/\D/g, "").slice(0, 6)); setPage(1); }} 
                className="pl-10 rounded-xl h-11 bg-blue-500/5 border-blue-500/10 text-slate-100 font-semibold focus-visible:ring-blue-500" 
                maxLength={6}
              />
            </div>
            <Button 
              variant="outline" 
              size="icon" 
              className="h-11 w-11 rounded-xl border-white/5 bg-[#0e142e] hover:bg-white/5 hover:text-white shrink-0"
              onClick={handleGPS} 
              disabled={gpsLoading}
            >
              <Locate className={`h-4 w-4 ${gpsLoading ? "animate-pulse" : ""}`} />
            </Button>
          </div>
        </div>
        
        {gpsLoading && <p className="text-xs text-blue-400 animate-pulse mt-2.5">🔍 Resolving GPS coordinates...</p>}
        {detectedArea && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }} 
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-2.5 mt-3 p-3 rounded-xl bg-blue-500/5 border border-blue-500/10"
          >
            <MapPin className="h-4 w-4 text-blue-400 shrink-0" />
            <span className="text-sm font-semibold text-white">{detectedArea.area}, {detectedArea.city}</span>
            <span className="text-xs text-slate-400">Pincode Area Matched</span>
            <Badge className="ml-auto bg-blue-600/10 text-blue-400 border border-blue-500/10 text-[10px] font-bold px-2">{detectedArea.pincode}</Badge>
          </motion.div>
        )}
      </motion.div>

      {/* Prompter */}
      {!showResults && (
        <motion.div variants={item} className="p-10 rounded-3xl bg-[#0e142e]/30 border border-white/5 text-center shadow-lg">
          <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/15">
            <Navigation className="h-8 w-8 text-blue-400" />
          </div>
          <h3 className="text-xl font-bold text-white tracking-tight">Enter Your Pincode</h3>
          <p className="text-slate-400 text-sm mt-1.5 mb-5 max-w-sm mx-auto">We strictly filter water distributors servicing your specific area to ensure lightning-fast delivery.</p>
          <Button 
            className="rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-md shadow-blue-600/15" 
            onClick={handleGPS} 
            disabled={gpsLoading}
          >
            <Locate className="h-4 w-4 mr-2" /> {gpsLoading ? "Locating..." : "Use Current Location"}
          </Button>
        </motion.div>
      )}

      {/* Results grid */}
      {showResults && (
        <>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
              <p className="text-sm text-slate-500 font-semibold">Filtering water suppliers...</p>
            </div>
          ) : sortedSuppliers.length === 0 ? (
            <div className="text-center py-20 bg-[#0e142e]/20 rounded-3xl border border-white/5">
              <div className="h-16 w-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
                <Droplets className="h-8 w-8 text-slate-600" />
              </div>
              <p className="text-lg font-bold text-white">No active suppliers found</p>
              <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">No water distributors are registered for pincode {pincodeInput} yet.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {sortedSuppliers.map(s => (
                <motion.div 
                  key={s.id || s._id} 
                  variants={item}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className="bg-[#0e142e]/80 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-blue-500/15 transition-all duration-300 group cursor-pointer"
                  onClick={() => navigate(`/customer/products?supplier=${s.user?._id || s.user?.id || s.user}`)}
                >
                  {/* Card Banner */}
                  <div className="h-16 bg-gradient-to-r from-blue-500/10 via-sky-500/5 to-transparent p-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/10">
                      ACTIVE
                    </span>
                    <Badge className="bg-[#0e142e] border-white/5 text-[10px] text-slate-400 font-semibold rounded-lg">
                      ⏰ {s.businessHours?.open || "8 AM"} - {s.businessHours?.close || "8 PM"}
                    </Badge>
                  </div>

                  <div className="p-6 pt-2 space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-white group-hover:text-blue-300 transition-colors truncate">{s.businessName}</h3>
                      {s.user?.name && (
                        <p className="text-xs text-slate-400 mt-0.5 font-medium">Contact: {s.user.name}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
                        <span className="text-sm font-black text-white">{Number(s.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-slate-500">({s.reviewCount || 0} reviews)</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed min-h-[32px]">{s.description || "Authorized mineral water distributor."}</p>

                    <div className="space-y-2 border-t border-white/5 pt-4 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-3.5 w-3.5 text-slate-500" />
                        <span>Services: <span className="text-slate-300 font-semibold">{s.serviceAreas?.join(", ") || "All Areas"}</span></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-slate-500" />
                        <span>Min Order: <span className="text-slate-300 font-semibold">{s.minOrder || 1} Jars</span></span>
                      </div>
                    </div>

                    {/* Fees block */}
                    <div className="bg-[#090d22] border border-white/5 rounded-xl p-3.5 text-center flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Delivery Fee</p>
                        <p className="text-lg font-black text-white mt-0.5">₹{s.deliveryCharge || 0}</p>
                      </div>
                      <Button className="rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs py-3 px-4">
                        View Products <ChevronRight className="h-3.5 w-3.5 ml-1 group-hover:translate-x-0.5 transition-transform" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Pagination Controls */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between mt-8 p-4 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-md">
              <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">
                Showing {((page - 1) * 6) + 1}-{Math.min(page * 6, pagination.total)} of {pagination.total} suppliers
              </p>
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                  onClick={() => setPage(prev => Math.max(1, prev - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-xs font-semibold px-2 text-slate-400">
                  Page {page} of {pagination.pages}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 px-2 rounded-lg border-white/5 bg-[#0e142e] hover:bg-white/5 text-white shrink-0"
                  onClick={() => setPage(prev => Math.min(pagination.pages, prev + 1))}
                  disabled={page >= pagination.pages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
}
