import { useState, useRef } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Package, X, Save, ImagePlus, Upload, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const categoryOptions = [
  { value: "bottle", label: "🍶 Bottle", sizes: [1, 2, 5, 10] },
  { value: "can", label: "🪣 Can", sizes: [20, 25] },
  { value: "jar", label: "🫙 Jar", sizes: [15, 18] },
  { value: "tanker", label: "🚛 Tanker", sizes: [1000, 2000, 5000, 10000] },
];

const emptyProduct = {
  name: "", category: "can", size_liters: 20, price: 40,
  stock: 0, description: "", image_url: "", active: true,
};

export default function SupplierProducts() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyProduct);
  const [filter, setFilter] = useState("all");

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["supplier-products", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const filtered = filter === "all" ? products : products.filter(p => p.category === filter);

  const handleSave = async () => {
    if (!supplier || !form.name.trim()) {
      toast({ title: "Product name required", variant: "destructive" });
      return;
    }

    if (editing) {
      const { error } = await supabase.from("products").update({
        name: form.name, category: form.category, size_liters: form.size_liters,
        price: form.price, stock: form.stock, description: form.description || null,
        image_url: form.image_url || null, active: form.active,
      } as any).eq("id", editing);
      if (error) { toast({ title: "Update failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product updated ✅" });
    } else {
      const { error } = await supabase.from("products").insert({
        supplier_id: supplier.id, name: form.name, category: form.category,
        size_liters: form.size_liters, price: form.price, stock: form.stock,
        description: form.description || null, image_url: form.image_url || null, active: form.active,
      } as any);
      if (error) { toast({ title: "Add failed", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Product added 🎉" });
    }

    queryClient.invalidateQueries({ queryKey: ["supplier-products"] });
    setEditing(null);
    setShowAdd(false);
    setForm(emptyProduct);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Product removed" }); queryClient.invalidateQueries({ queryKey: ["supplier-products"] }); }
  };

  const startEdit = (p: any) => {
    setForm({
      name: p.name, category: p.category, size_liters: p.size_liters,
      price: Number(p.price), stock: p.stock, description: p.description || "",
      image_url: p.image_url || "", active: p.active,
    });
    setEditing(p.id);
    setShowAdd(true);
  };

  const catIcon = (cat: string) =>
    cat === "bottle" ? "🍶" : cat === "tanker" ? "🚛" : cat === "jar" ? "🫙" : "🪣";

  const stats = [
    { label: "Total Products", value: products.length, color: "text-primary", bg: "bg-primary/10" },
    { label: "Active", value: products.filter(p => p.active).length, color: "text-success", bg: "bg-success/10" },
    { label: "Out of Stock", value: products.filter(p => p.stock === 0).length, color: "text-destructive", bg: "bg-destructive/10" },
    { label: "Categories", value: new Set(products.map(p => p.category)).size, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">My Products</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Manage your water product catalog</p>
        </div>
        <Button className="rounded-xl gap-2 shadow-md shadow-primary/10" onClick={() => { setForm(emptyProduct); setEditing(null); setShowAdd(true); }}>
          <Plus className="h-4 w-4" /> Add Product
        </Button>
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(s => (
          <div key={s.label} className="glass-card rounded-2xl p-4 text-center">
            <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Category filter */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
        {[{ key: "all", label: "All", icon: "💧" }, ...categoryOptions.map(c => ({ key: c.value, label: c.label, icon: "" }))].map(c => (
          <button key={c.key} onClick={() => setFilter(c.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === c.key ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            {c.icon || ""} {c.label}
          </button>
        ))}
      </motion.div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="glass-card rounded-2xl p-5 space-y-4 overflow-hidden border-2 border-primary/20">
            <div className="flex items-center justify-between">
              <h3 className="font-heading font-semibold flex items-center gap-2">
                <Package className="h-4 w-4 text-primary" />
                {editing ? "Edit Product" : "Add New Product"}
              </h3>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => { setShowAdd(false); setEditing(null); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs">Product Name</Label>
                <Input className="mt-1 rounded-xl" placeholder="e.g. Premium RO Water Can"
                  value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <Label className="text-xs">Category</Label>
                <Select value={form.category} onValueChange={v => {
                  const cat = categoryOptions.find(c => c.value === v);
                  setForm({ ...form, category: v, size_liters: cat?.sizes[0] || 20 });
                }}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {categoryOptions.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Size (Liters)</Label>
                <Select value={String(form.size_liters)} onValueChange={v => setForm({ ...form, size_liters: Number(v) })}>
                  <SelectTrigger className="mt-1 rounded-xl"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(categoryOptions.find(c => c.value === form.category)?.sizes || [20]).map(s => (
                      <SelectItem key={s} value={String(s)}>{s}L</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Price (₹)</Label>
                <Input type="number" className="mt-1 rounded-xl" value={form.price}
                  onChange={e => setForm({ ...form, price: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Stock</Label>
                <Input type="number" className="mt-1 rounded-xl" value={form.stock}
                  onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
              </div>
              <div>
                <Label className="text-xs">Image URL (optional)</Label>
                <Input className="mt-1 rounded-xl" placeholder="https://..." value={form.image_url}
                  onChange={e => setForm({ ...form, image_url: e.target.value })} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs">Description (optional)</Label>
                <Textarea className="mt-1 rounded-xl resize-none" rows={2} placeholder="Product details..."
                  value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.active} onCheckedChange={v => setForm({ ...form, active: v })} />
                <Label className="text-xs">{form.active ? "🟢 Active" : "⚫ Inactive"}</Label>
              </div>
            </div>

            <Button className="rounded-xl w-full gap-2 shadow-md shadow-primary/10" onClick={handleSave}>
              <Save className="h-4 w-4" /> {editing ? "Update Product" : "Add Product"}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Products Grid */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading products...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No products yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add your first water product to get started</p>
          <Button className="mt-4 rounded-xl gap-2" onClick={() => { setForm(emptyProduct); setShowAdd(true); }}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(p => (
            <motion.div key={p.id} variants={item}
              whileHover={{ y: -3, transition: { duration: 0.2 } }}
              className="glass-card rounded-2xl overflow-hidden group">
              {/* Image */}
              <div className="relative h-32 bg-gradient-to-br from-primary/5 via-accent/5 to-transparent flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-5xl">{catIcon(p.category)}</span>
                )}
                <Badge className="absolute top-2 left-2 bg-card/80 backdrop-blur text-[10px] border-0">
                  {Number(p.size_liters)}L
                </Badge>
                {!p.active && (
                  <Badge variant="destructive" className="absolute top-2 right-2 text-[10px]">Inactive</Badge>
                )}
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-heading font-semibold text-sm line-clamp-1">{p.name}</h4>
                    <p className="text-[11px] text-muted-foreground capitalize">{p.category} · {Number(p.size_liters)}L</p>
                  </div>
                  <p className="font-heading font-bold text-primary text-lg">₹{Number(p.price)}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold ${p.stock > 0 ? "text-success" : "text-destructive"}`}>
                      {p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <Button size="sm" variant="outline" className="rounded-xl flex-1 gap-1.5 glass text-xs" onClick={() => startEdit(p)}>
                    <Pencil className="h-3 w-3" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5 text-destructive hover:bg-destructive/10 text-xs"
                    onClick={() => handleDelete(p.id)}>
                    <Trash2 className="h-3 w-3" />
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
