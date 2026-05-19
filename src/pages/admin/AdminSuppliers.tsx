import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Truck, MapPin, Star, ShieldBan, ShieldCheck, Search, Clock, Package, ChevronRight, TrendingUp, Phone, Mail, User, Info, Building } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminSuppliers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState<any>(null);

  const { data: suppliers = [], isLoading: suppliersLoading } = useQuery({
    queryKey: ["admin-suppliers-dedicated"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("business_name", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles-for-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("user_id, full_name, phone, email");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-for-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const suppliersWithProfiles = suppliers.map((s: any) => ({
    ...s,
    profiles: profiles.find((p: any) => p.user_id === s.user_id)
  }));

  const filteredSuppliers = suppliersWithProfiles.filter((s: any) => 
    !search || 
    s.business_name.toLowerCase().includes(search.toLowerCase()) || 
    s.area.toLowerCase().includes(search.toLowerCase())
  );

  const toggleBlock = async (e: React.MouseEvent, supplierId: string, currentBlocked: boolean) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("suppliers")
      .update({ blocked: !currentBlocked } as any)
      .eq("id", supplierId);
    
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentBlocked ? "Supplier Unblocked ✅" : "Supplier Blocked 🚫" });
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers-dedicated"] });
    }
  };

  const toggleAvailability = async (e: React.MouseEvent, supplierId: string, currentAvailable: boolean) => {
    e.stopPropagation();
    const { error } = await supabase
      .from("suppliers")
      .update({ available: !currentAvailable })
      .eq("id", supplierId);
    
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: currentAvailable ? "Supplier Deactivated" : "Supplier Activated ✅" });
      queryClient.invalidateQueries({ queryKey: ["admin-suppliers-dedicated"] });
    }
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Manage Suppliers</h2>
          <p className="text-muted-foreground text-sm mt-0.5">
            {suppliers.length} total registered suppliers
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge variant="secondary" className="px-3 py-1 rounded-lg bg-success/10 text-success border-success/20">
             {suppliers.filter((s: any) => s.available && !s.blocked).length} Active
           </Badge>
           <Badge variant="secondary" className="px-3 py-1 rounded-lg bg-destructive/10 text-destructive border-destructive/20">
             {suppliers.filter((s: any) => s.blocked).length} Blocked
           </Badge>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Search supplier name, area..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl h-11 bg-muted/30 border-0" 
        />
      </motion.div>

      {/* Suppliers List */}
      {suppliersLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading suppliers...</p>
        </div>
      ) : filteredSuppliers.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-2xl">
          <Truck className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <p className="font-heading font-semibold text-lg">No suppliers found</p>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredSuppliers.map((s: any) => {
            const supplierOrders = orders.filter(o => o.supplier_id === s.id);
            const revenue = supplierOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0);
            const recentOrder = supplierOrders[0];

            return (
              <motion.div 
                key={s.id} 
                variants={item} 
                onClick={() => setSelectedSupplier(s)}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer border border-transparent hover:border-primary/20"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Supplier Info */}
                    <div className="flex items-start gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-2xl shrink-0 border border-primary/10">
                        🚛
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-heading font-bold text-lg">{s.business_name}</h3>
                          {s.blocked && <Badge variant="destructive" className="rounded-lg text-[10px] h-5">Blocked</Badge>}
                          <Badge className={`rounded-lg text-[10px] h-5 ${s.available ? "bg-success/10 text-success border-success/20" : "bg-muted text-muted-foreground border-border"}`}>
                            {s.available ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{s.area}</span>
                          <span className="flex items-center gap-1"><Star className="h-3 w-3 fill-warning text-warning" />{Number(s.rating).toFixed(1)}</span>
                          <span className="font-medium text-foreground">Stock: {s.stock}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 flex-1 lg:max-w-md">
                      <div className="glass rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Orders</p>
                        <p className="font-heading font-bold text-lg mt-0.5">{supplierOrders.length}</p>
                      </div>
                      <div className="glass rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Revenue</p>
                        <p className="font-heading font-bold text-lg mt-0.5">₹{revenue > 1000 ? (revenue / 1000).toFixed(1) + "K" : revenue}</p>
                      </div>
                      <div className="glass rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Growth</p>
                        <p className="font-heading font-bold text-lg mt-0.5 text-success">
                          <TrendingUp className="h-4 w-4 inline mr-1" />
                          {supplierOrders.length > 0 ? "8%" : "0%"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                      <Button 
                        size="sm" 
                        variant={s.blocked ? "default" : "destructive"} 
                        className="gap-1.5 rounded-xl flex-1 shadow-sm" 
                        onClick={(e) => toggleBlock(e, s.id, s.blocked)}
                      >
                        {s.blocked ? <><ShieldCheck className="h-3.5 w-3.5" /> Unblock</> : <><ShieldBan className="h-3.5 w-3.5" /> Block</>}
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="rounded-xl glass flex-1 border-border/50" 
                        onClick={(e) => toggleAvailability(e, s.id, s.available)}
                      >
                        {s.available ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </div>

                  {/* Activity Bar */}
                  <div className="mt-5 pt-4 border-t border-border/50">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Recent Activity
                      </p>
                      {recentOrder && (
                        <span className="text-[10px] text-muted-foreground">
                          Last order {new Date(recentOrder.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {recentOrder ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-border/50 group-hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-primary" />
                          <div>
                            <p className="text-xs font-semibold">New order #{recentOrder.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-muted-foreground">₹{recentOrder.total_amount} · {recentOrder.status}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic py-2">No recent activity recorded.</p>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Supplier Details Dialog */}
      <Dialog open={!!selectedSupplier} onOpenChange={() => setSelectedSupplier(null)}>
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border-0 shadow-2xl">
          {selectedSupplier && (
            <div className="flex flex-col">
              {/* Cover/Header */}
              <div className="h-32 bg-gradient-to-br from-primary via-blue-600 to-accent p-6 relative">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                <div className="relative z-10 flex items-center gap-4 mt-8">
                  <div className="h-20 w-20 rounded-2xl bg-card shadow-xl flex items-center justify-center text-3xl border-4 border-card">
                    🚛
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold font-heading">{selectedSupplier.business_name}</h2>
                    <p className="text-white/80 text-sm flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {selectedSupplier.area}, {selectedSupplier.pincode}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-12 space-y-6">
                {/* Contact Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Owner Name</p>
                      <p className="text-sm font-semibold truncate">{selectedSupplier.profiles?.full_name || "Not Provided"}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                      <Phone className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Contact No</p>
                      <p className="text-sm font-semibold">{selectedSupplier.profiles?.phone || "Not Provided"}</p>
                    </div>
                  </div>
                  <div className="glass-card rounded-2xl p-4 flex items-center gap-3 sm:col-span-1">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                      <Mail className="h-5 w-5 text-violet-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-muted-foreground uppercase font-bold">Email Address</p>
                      <p className="text-sm font-semibold truncate" title={selectedSupplier.profiles?.email}>
                        {selectedSupplier.profiles?.email || "Not Provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Building className="h-3.5 w-3.5" /> Business Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">Water Type</p>
                      <p className="text-sm font-medium">{selectedSupplier.water_type}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">Delivery Time</p>
                      <p className="text-sm font-medium">{selectedSupplier.delivery_time}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">Vehicle No</p>
                      <p className="text-sm font-medium">{selectedSupplier.vehicle_number || "NA"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-muted/30 border border-border/50">
                      <p className="text-[10px] text-muted-foreground">Driver Contact</p>
                      <p className="text-sm font-medium">{selectedSupplier.driver_phone || "NA"}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                    <Info className="h-3.5 w-3.5" /> Pricing & Inventory
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-xs text-primary font-semibold">Can Price</p>
                      <p className="text-2xl font-bold font-heading">₹{Number(selectedSupplier.price_per_can)}</p>
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-accent/5 border border-accent/10">
                      <p className="text-xs text-accent font-semibold">Tanker Price</p>
                      <p className="text-2xl font-bold font-heading">₹{Number(selectedSupplier.price_per_tanker)}</p>
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-muted/50 border border-border">
                      <p className="text-xs text-muted-foreground font-semibold">Stock</p>
                      <p className="text-2xl font-bold font-heading">{selectedSupplier.stock}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <Button className="flex-1 rounded-xl h-11" onClick={() => setSelectedSupplier(null)}>
                    Close Details
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
