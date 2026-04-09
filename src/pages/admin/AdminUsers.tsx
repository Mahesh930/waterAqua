import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShieldBan, ShieldCheck, Users, Truck, MapPin, Package, Search, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<"customers" | "suppliers">("customers");
  const [search, setSearch] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("customer_id, supplier_id, total_amount, status");
      if (error) throw error;
      return data;
    },
  });

  const customerProfiles = profiles.filter(p =>
    roles.some(r => r.user_id === p.user_id && r.role === "customer")
  ).filter(p => !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  const filteredSuppliers = suppliers.filter(s => !search || s.business_name.toLowerCase().includes(search.toLowerCase()) || s.area.toLowerCase().includes(search.toLowerCase()));

  const toggleBlock = async (supplierId: string, currentBlocked: boolean) => {
    const { error } = await supabase.from("suppliers").update({ blocked: !currentBlocked } as any).eq("id", supplierId);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: currentBlocked ? "Supplier Unblocked ✅" : "Supplier Blocked 🚫" }); queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] }); }
  };

  const toggleAvailability = async (supplierId: string, currentAvailable: boolean) => {
    const { error } = await supabase.from("suppliers").update({ available: !currentAvailable }).eq("id", supplierId);
    if (error) toast({ title: "Failed", description: error.message, variant: "destructive" });
    else { toast({ title: currentAvailable ? "Supplier Deactivated" : "Supplier Activated ✅" }); queryClient.invalidateQueries({ queryKey: ["admin-suppliers"] }); }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Users & Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{profiles.length} users · {suppliers.length} suppliers</p>
        </div>
      </motion.div>

      {/* Tab + Search */}
      <motion.div variants={item} className="flex flex-col sm:flex-row gap-3">
        <div className="flex gap-1.5">
          <button onClick={() => setTab("customers")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === "customers" ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            <Users className="h-3.5 w-3.5" /> Customers ({customerProfiles.length})
          </button>
          <button onClick={() => setTab("suppliers")}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
              tab === "suppliers" ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            <Truck className="h-3.5 w-3.5" /> Suppliers ({filteredSuppliers.length})
          </button>
        </div>
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder={`Search ${tab}...`} value={search} onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl bg-muted/30 border-0" />
        </div>
      </motion.div>

      {/* Customers */}
      {tab === "customers" && (
        <div className="space-y-2">
          {customerProfiles.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No customers found</p>
            </div>
          ) : (
            customerProfiles.map((c, i) => {
              const customerOrders = orders.filter(o => o.customer_id === c.user_id);
              const spent = customerOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
              return (
                <motion.div key={c.id} variants={item}
                  className="glass-card rounded-2xl p-4 flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">👤</div>
                  <div className="flex-1 min-w-0">
                    <p className="font-heading font-semibold text-sm truncate">{c.full_name || "Unnamed"}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      {c.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{c.phone}</span>}
                      <span>{customerOrders.length} orders</span>
                      <span className="font-medium text-foreground">₹{spent}</span>
                    </div>
                  </div>
                  <Badge className="rounded-lg bg-primary/10 text-primary border-0">Customer</Badge>
                </motion.div>
              );
            })
          )}
        </div>
      )}

      {/* Suppliers */}
      {tab === "suppliers" && (
        <div className="space-y-3">
          {filteredSuppliers.length === 0 ? (
            <div className="text-center py-16 glass-card rounded-2xl">
              <Truck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No suppliers found</p>
            </div>
          ) : (
            filteredSuppliers.map((s: any) => {
              const supplierOrders = orders.filter(o => o.supplier_id === s.id);
              const revenue = supplierOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0);
              return (
                <motion.div key={s.id} variants={item}
                  className="glass-card rounded-2xl overflow-hidden">
                  <div className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-xl shrink-0">🚛</div>
                        <div>
                          <p className="font-heading font-semibold">{s.business_name}</p>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                            <span className="flex items-center gap-0.5"><MapPin className="h-3 w-3" />{s.area}</span>
                            <span className="flex items-center gap-0.5"><Star className="h-3 w-3 fill-warning text-warning" />{Number(s.rating).toFixed(1)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {s.blocked && <Badge variant="destructive" className="rounded-lg text-[10px]">Blocked</Badge>}
                        <Badge className={`rounded-lg text-[10px] ${s.available ? "bg-success/10 text-success border-0" : "bg-muted text-muted-foreground border-0"}`}>
                          {s.available ? "🟢 Active" : "⚫ Inactive"}
                        </Badge>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { label: "Stock", value: s.stock },
                        { label: "Orders", value: supplierOrders.length },
                        { label: "Revenue", value: `₹${revenue}` },
                        { label: "Can Price", value: `₹${Number(s.price_per_can)}` },
                      ].map(stat => (
                        <div key={stat.label} className="glass rounded-lg p-2 text-center">
                          <p className="font-heading font-bold text-sm">{stat.value}</p>
                          <p className="text-[9px] text-muted-foreground">{stat.label}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant={s.blocked ? "default" : "destructive"} className="gap-1.5 rounded-xl flex-1" onClick={() => toggleBlock(s.id, s.blocked)}>
                        {s.blocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Unblock</> : <><ShieldBan className="h-3.5 w-3.5" /> Block</>}
                      </Button>
                      <Button size="sm" variant="outline" className="rounded-xl glass flex-1" onClick={() => toggleAvailability(s.id, s.available)}>
                        {s.available ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </div>
      )}
    </motion.div>
  );
}
