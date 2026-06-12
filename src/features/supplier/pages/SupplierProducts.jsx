import React, { useState, useMemo } from "react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Switch } from "@/ui/switch";
import { Badge } from "@/ui/badge";
import { Textarea } from "@/ui/textarea";
import { Plus, Pencil, Trash2, Package, X, Save, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation, useUploadProductImageMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const categoryOptions = [
  { value: "20L Can", label: "🪣 Can (20L)" },
  { value: "Bottle", label: "🍶 Bottle" },
  { value: "20L Jar", label: "🫙 Jar (20L)" },
  { value: "Tanker", label: "🚛 Tanker" },
];

const emptyProduct = {
  name: "",
  category: "20L Can",
  price: 60,
  capacityLiters: 20,
  imageUrl: "",
  description: "",
  stock: 100,
  isActive: true
};

export default function SupplierProducts() {
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [filter, setFilter] = useState("all");

  // RTK Queries & Mutations
  const { data: products = [], isLoading } = useGetProductsQuery({ 
    supplierId: user?.id || user?._id 
  });
  
  const [createProduct, { isLoading: adding }] = useCreateProductMutation();
  const [updateProduct, { isLoading: saving }] = useUpdateProductMutation();
  const [deleteProduct] = useDeleteProductMutation();
  const [uploadProductImage, { isLoading: uploading }] = useUploadProductImageMutation();

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Invalid file type", description: "Please upload an image file", variant: "destructive" });
      return;
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const result = await uploadProductImage(formData).unwrap();
      setForm(prev => ({ ...prev, imageUrl: result.url }));
      toast({ title: "Image uploaded successfully 📸" });
    } catch (err) {
      toast({
        title: "Upload failed",
        description: err?.data?.error || "Error uploading image",
        variant: "destructive"
      });
    }
  };

  const filteredProducts = useMemo(() => {
    if (filter === "all") return products;
    return products.filter(p => p.category === filter);
  }, [products, filter]);

  const handleSave = async (e) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast({ title: "Product name required", variant: "destructive" });
      return;
    }

    try {
      if (editingId) {
        await updateProduct({
          id: editingId,
          body: {
            name: form.name,
            category: form.category,
            price: Number(form.price),
            capacityLiters: Number(form.capacityLiters),
            imageUrl: form.imageUrl,
            description: form.description,
            stock: Number(form.stock),
            isActive: form.isActive
          }
        }).unwrap();
        toast({ title: "Product updated ✅" });
      } else {
        await createProduct({
          name: form.name,
          category: form.category,
          price: Number(form.price),
          capacityLiters: Number(form.capacityLiters),
          imageUrl: form.imageUrl || "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop",
          description: form.description,
          stock: Number(form.stock),
          isActive: form.isActive
        }).unwrap();
        toast({ title: "Product added 🎉" });
      }

      setEditingId(null);
      setShowForm(false);
      setForm(emptyProduct);
    } catch (error) {
      toast({
        title: "Operation failed",
        description: error?.data?.error || "Error saving product",
        variant: "destructive"
      });
    }
  };

  const startEdit = (p) => {
    setForm({
      name: p.name,
      category: p.category,
      price: p.price,
      capacityLiters: p.capacityLiters || 20,
      imageUrl: p.imageUrl || "",
      description: p.description || "",
      stock: p.stock || 100,
      isActive: p.isActive
    });
    setEditingId(p.id || p._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to remove this product from the catalog?")) {
      try {
        await deleteProduct(id).unwrap();
        toast({ title: "Product successfully deleted" });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Error removing product",
          variant: "destructive"
        });
      }
    }
  };

  const catIcon = (cat) => {
    if (cat === "Bottle") return "🍶";
    if (cat === "20L Jar") return "🫙";
    if (cat === "Tanker") return "🚛";
    if (cat === "Other") return "🔧";
    return "🪣";
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Page Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tight">My Products</h2>
          <p className="text-slate-400 text-sm mt-0.5">Manage water items in your distributor catalog.</p>
        </div>
        <Button 
          className="rounded-xl gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/10 border-0" 
          onClick={() => { setForm(emptyProduct); setEditingId(null); setShowForm(true); }}
        >
          <Plus className="h-4 w-4" /> Add Product Item
        </Button>
      </motion.div>

      {/* Stats Widgets */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Total Items", value: products.length, color: "text-blue-400" },
          { label: "Active Items", value: products.filter(p => p.isActive).length, color: "text-emerald-400" },
          { label: "Out of Stock", value: products.filter(p => p.stock === 0).length, color: "text-red-400" },
          { label: "Water Cans", value: products.filter(p => p.category === "20L Can").length, color: "text-amber-400" },
        ].map(s => (
          <div key={s.label} className="p-4 bg-[#0e142e]/60 border border-white/5 rounded-2xl text-center shadow-md">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Category Pills */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {[{ key: "all", label: "All Items" }, ...categoryOptions.map(c => ({ key: c.value, label: c.label }))].map(c => (
          <button 
            key={c.key} 
            onClick={() => setFilter(c.key)}
            className={`px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === c.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            {c.label}
          </button>
        ))}
      </motion.div>

      {/* Add / Edit Form Panel */}
      <AnimatePresence>
        {showForm && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }} 
            animate={{ opacity: 1, height: "auto" }} 
            exit={{ opacity: 0, height: 0 }}
            className="p-5 bg-[#0e142e]/60 border border-blue-500/20 rounded-2xl shadow-xl overflow-hidden space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Package className="h-4 w-4 text-blue-400" />
                {editingId ? "Edit Product Details" : "Add New Water Can/Bottle"}
              </h3>
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-slate-400 hover:text-white rounded-lg hover:bg-white/5" 
                onClick={() => { setShowForm(false); setEditingId(null); }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Product Name</Label>
                  <Input 
                    className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                    placeholder="e.g. 20L Premium Purified Can"
                    value={form.name} 
                    onChange={e => setForm({ ...form, name: e.target.value })} 
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Category</Label>
                  <select
                    value={form.category}
                    onChange={e => setForm({ ...form, category: e.target.value, capacityLiters: (e.target.value === "20L Can" || e.target.value === "20L Jar") ? 20 : e.target.value === "Tanker" ? 5000 : 1 })}
                    className="w-full mt-1 px-3.5 rounded-xl h-11 bg-[#090d22] border border-white/5 text-white text-sm font-semibold focus-visible:ring-blue-500"
                  >
                    {categoryOptions.map(c => <option key={c.value} value={c.value} className="bg-[#0e142e] text-white font-medium">{c.label}</option>)}
                  </select>
                </div>
                <div>
                  <Label className="text-slate-300">Capacity (Liters)</Label>
                  <Input 
                    type="number"
                    className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                    value={form.capacityLiters} 
                    onChange={e => setForm({ ...form, capacityLiters: Number(e.target.value) })} 
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Price (₹)</Label>
                  <Input 
                    type="number"
                    className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                    value={form.price}
                    onChange={e => setForm({ ...form, price: Number(e.target.value) })} 
                    required
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Stock Inventory</Label>
                  <Input 
                    type="number"
                    className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                    value={form.stock}
                    onChange={e => setForm({ ...form, stock: Number(e.target.value) })} 
                    required
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-slate-300">Product Image</Label>
                  <div className="mt-1.5 flex flex-col md:flex-row gap-4 items-start">
                    {/* Upload Card / Preview */}
                    <div className="relative w-full md:w-48 h-32 rounded-xl bg-[#090d22] border border-dashed border-white/10 hover:border-blue-500/50 flex flex-col items-center justify-center overflow-hidden transition-all group">
                      {form.imageUrl ? (
                        <>
                          <img 
                            src={form.imageUrl} 
                            alt="Preview" 
                            className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-2">
                            <button
                              type="button"
                              onClick={() => document.getElementById("product-image-file").click()}
                              className="p-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-500 transition-colors"
                            >
                              <Upload className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setForm(prev => ({ ...prev, imageUrl: "" }))}
                              className="p-1.5 rounded-lg bg-red-600 text-white hover:bg-red-500 transition-colors"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={uploading}
                          onClick={() => document.getElementById("product-image-file").click()}
                          className="w-full h-full flex flex-col items-center justify-center p-4 text-slate-400 hover:text-white transition-colors"
                        >
                          {uploading ? (
                            <Loader2 className="h-6 w-6 animate-spin text-blue-400 mb-2" />
                          ) : (
                            <Upload className="h-6 w-6 text-blue-400 mb-2 group-hover:-translate-y-0.5 transition-transform" />
                          )}
                          <span className="text-xs font-bold">{uploading ? "Uploading..." : "Upload Image"}</span>
                          <span className="text-[10px] text-slate-500 mt-1">PNG, JPG up to 5MB</span>
                        </button>
                      )}
                      <input 
                        id="product-image-file"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleImageUpload}
                        disabled={uploading}
                      />
                    </div>

                    {/* Manual Image URL (optional/flexible fallback) */}
                    <div className="flex-1 w-full space-y-2">
                      <Label className="text-xs text-slate-400">Or paste an Image URL manually</Label>
                      <Input 
                        className="rounded-xl bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500 text-xs h-10" 
                        placeholder="https://images.unsplash.com/..."
                        value={form.imageUrl} 
                        onChange={e => setForm({ ...form, imageUrl: e.target.value })} 
                      />
                      <p className="text-[10px] text-slate-500 leading-normal">
                        Tip: Uploading a direct, high-quality image of your water can will attract more customer orders.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="sm:col-span-2">
                  <Label className="text-slate-300">Product Description</Label>
                  <Textarea 
                    className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white resize-none" 
                    rows={2} 
                    placeholder="Describe water purification standard, handle jar, brand type..."
                    value={form.description} 
                    onChange={e => setForm({ ...form, description: e.target.value })} 
                  />
                </div>
                <div className="flex items-center gap-3.5 mt-2">
                  <Switch 
                    checked={form.isActive} 
                    onCheckedChange={v => setForm({ ...form, isActive: v })} 
                  />
                  <Label className="text-xs font-bold text-slate-300">{form.isActive ? "🟢 Active in Catalog" : "⚫ Inactive in Catalog"}</Label>
                </div>
              </div>

              <Button 
                type="submit"
                className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold shadow-lg shadow-blue-500/20 border-0 mt-6"
                disabled={adding || saving}
              >
                <Save className="h-4 w-4 mr-1.5" /> {editingId ? "Update Product" : "Save to Catalog"}
              </Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Product Catalog Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
          <p className="text-sm text-slate-500 font-semibold">Loading distributor inventory...</p>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/20 rounded-3xl border border-white/5">
          <Package className="h-16 w-16 mx-auto text-slate-600 mb-4" />
          <p className="text-lg font-bold text-white">Your product catalog is empty</p>
          <p className="text-slate-500 text-sm mt-1">Add water products to begin receiving user orders.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map(p => (
            <motion.div 
              key={p.id || p._id} 
              variants={item}
              whileHover={{ y: -3 }}
              className="bg-[#0e142e]/80 border border-white/5 rounded-2xl overflow-hidden group shadow-lg"
            >
              {/* Product Media */}
              <div className="relative h-40 bg-[#090d22] flex items-center justify-center border-b border-white/5">
                <img 
                  src={p.imageUrl || "https://images.unsplash.com/photo-1548839140-29a749e1cf4d?q=80&w=300&auto=format&fit=crop"} 
                  alt={p.name} 
                  className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" 
                />
                <Badge className="absolute top-2 left-2 bg-[#0e142e] border-white/5 text-[10px] font-bold px-2 py-0.5 rounded-md">
                  {p.capacityLiters} Liters
                </Badge>
                {!p.isActive && (
                  <Badge className="absolute top-2 right-2 bg-red-500/10 border border-red-500/15 text-red-400 text-[10px] font-bold rounded-md">
                    INACTIVE
                  </Badge>
                )}
              </div>

              {/* Product Content Details */}
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-base text-white truncate max-w-[150px]">{p.name}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold mt-0.5">{catIcon(p.category)} {p.category}</p>
                  </div>
                  <p className="font-black text-blue-400 text-lg">₹{p.price}</p>
                </div>

                <div className="flex items-center justify-between border-t border-white/5 pt-3.5">
                  <span className={`text-xs font-bold ${p.stock > 0 ? "text-emerald-400" : "text-red-400"}`}>
                    {p.stock > 0 ? `${p.stock} units in stock` : "Out of stock!"}
                  </span>
                </div>

                <div className="flex gap-2 pt-2 border-t border-white/5">
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="flex-1 rounded-xl h-9 text-xs font-bold gap-1 bg-[#0e142e] border-white/5 hover:bg-white/5 hover:text-white" 
                    onClick={() => startEdit(p)}
                  >
                    <Pencil className="h-3 w-3 mr-1 text-blue-400" /> Edit Catalog
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="rounded-xl h-9 text-xs font-bold gap-1 text-red-400 hover:text-white hover:bg-red-500/20 border-white/5 bg-[#0e142e]"
                    onClick={() => handleDelete(p.id || p._id)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
