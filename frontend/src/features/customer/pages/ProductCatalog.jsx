import React, { useState, useEffect, useMemo } from "react";
import { Search, Package, ShoppingCart, Plus, Star, MapPin, Loader2 } from "lucide-react";
import { useSearchParams, Link } from "react-router-dom";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { useCart } from "@/features/customer/hooks/use-cart";
import { useGetProductsQuery, useGetSupplierByIdQuery } from "@/store/api";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";

const categories = [
  { key: "all", label: "All Products" },
  { key: "20L Can", label: "Cans (20L)" },
  { key: "Bottle", label: "Bottles" },
  { key: "20L Jar", label: "Jars (20L)" },
  { key: "Tanker", label: "Tankers" }
];

export default function ProductCatalog() {
  const [searchParams] = useSearchParams();
  const supplierId = searchParams.get("supplier");

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const { addToCart } = useCart();
  const { user } = useAuth();

  // Queries
  const { data: supplierDetails } = useGetSupplierByIdQuery(supplierId, { skip: !supplierId });
  const { data: products = [], isLoading } = useGetProductsQuery({
    supplierId: supplierId || undefined,
    pincode: !supplierId ? user?.pincode : undefined,
    category: category !== "all" ? category : undefined,
    search: search || undefined
  });

  const filteredProducts = useMemo(() => {
    return products.filter(p => p.isActive && p.stock > 0);
  }, [products]);

  return (
    <div className="space-y-6 py-2 text-slate-200">
      {/* Catalog Header */}
      <div>
        {supplierId && supplierDetails ? (
          <div className="p-6 bg-[#0e142e]/60 border border-white/5 rounded-3xl mb-4 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl" />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
              <div>
                <span className="text-[10px] font-black text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-500/10 uppercase tracking-widest">
                  Buying From
                </span>
                <h1 className="text-3xl font-black text-white mt-2.5 tracking-tight">{supplierDetails.businessName}</h1>
                <div className="flex items-center gap-2 mt-2 text-sm text-slate-400">
                  <MapPin className="h-4 w-4 text-slate-500 shrink-0" />
                  <span>Servicing: <span className="text-slate-300 font-semibold">{supplierDetails.serviceAreas?.join(", ") || "Your Area"}</span></span>
                  <span className="text-slate-600 font-black">·</span>
                  <Star className="h-4 w-4 fill-amber-500 text-amber-500 shrink-0" />
                  <span className="text-white font-bold">{Number(supplierDetails.rating || 0).toFixed(1)}</span>
                </div>
              </div>
              <Link to="/customer/suppliers">
                <Button variant="outline" size="sm" className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300 hover:text-white">
                  Change Supplier
                </Button>
              </Link>
            </div>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">Water Catalog</h1>
            <p className="text-slate-400 text-sm mt-0.5">
              {user?.pincode
                ? `Browsing pure hydration packs servicing your pincode (${user.pincode})`
                : "Browse pure hydration packs from local verified suppliers."
              }
            </p>
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className="p-4 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
          <Input
            placeholder="Search catalog products..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl h-11 bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto scrollbar-hide py-1">
          {categories.map(c => {
            const active = category === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setCategory(c.key)}
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${active
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/10"
                  : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
                  }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Products Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-[#0e142e]/50 border border-white/5 rounded-2xl overflow-hidden animate-pulse min-h-[250px]">
              <div className="h-36 bg-white/5" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-white/5 rounded w-3/4" />
                <div className="h-3 bg-white/5 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/20 rounded-3xl border border-white/5">
          <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <p className="text-lg font-bold text-white">No products found</p>
          <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
            {search ? "No products match your search keyword." : "This supplier catalog is empty."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredProducts.map(p => (
            <motion.div
              key={p.id || p._id}
              whileHover={{ y: -3 }}
              className="bg-[#0e142e]/80 border border-white/5 rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl hover:border-blue-500/15 flex flex-col transition-all duration-300 group"
            >
              {/* Product Media */}
              <div className="relative h-40 bg-[#090d22] flex items-center justify-center overflow-hidden border-b border-white/5 p-2">
                <img
                  src={p.imageUrl || "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop"}
                  alt={p.name}
                  className="h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
                />
                <Badge
                  variant="outline"
                  className="
    absolute top-2 left-2
    bg-white text-slate-900 border-slate-300
    dark:bg-slate-950 dark:text-white dark:border-white/10
    text-[10px] font-bold px-2 py-0.5 rounded-md shadow-sm
  "
                >
                  {p.capacityLiters}L
                </Badge>
                <Badge className="absolute top-2 right-2 bg-emerald-500/10 border border-emerald-500/15 text-emerald-400 text-[9px] font-bold px-2 py-0.5 rounded-md">
                  {p.stock} In Stock
                </Badge>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-sm text-white group-hover:text-blue-300 transition-colors line-clamp-1">{p.name}</h4>
                  {p.supplierProfile && (
                    <div className="flex items-center gap-1.5 mt-1 text-[11px] text-slate-400">
                      <span className="font-semibold text-slate-300 truncate max-w-[120px]">{p.supplierProfile.businessName}</span>
                      <span className="text-slate-600 font-black">·</span>
                      <Star className="h-3 w-3 fill-amber-500 text-amber-500 shrink-0" />
                      <span className="text-slate-300 font-bold">{Number(p.supplierProfile.rating || 0).toFixed(1)}</span>
                    </div>
                  )}
                  <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed min-h-[32px]">
                    {p.description || "Fresh purified mineral drinking water."}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 mt-4 border-t border-white/5">
                  <div>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase leading-none">Price</p>
                    <p className="font-black text-blue-400 text-lg leading-none mt-1">₹{p.price}</p>
                  </div>
                  <Button
                    size="sm"
                    className="rounded-lg h-9 px-3.5 text-xs font-bold gap-1 bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/10 border-0"
                    onClick={() => addToCart.mutate({ productId: p.id || p._id, quantity: 1 })}
                  >
                    <Plus className="h-4 w-4 mr-0.5" /> Add
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
