import React, { useState } from "react";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Truck, MapPin, Star, ShieldBan, ShieldCheck, Search, Clock, Package, ChevronRight, TrendingUp, Phone, Mail, User, Info, Building } from "lucide-react";
import { Input } from "@/ui/input";
import { useToast } from "@/shared/hooks/use-toast";
import { useGetAdminSuppliersQuery, useGetOrdersQuery, useToggleUserStatusMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/ui/dialog";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminSuppliers() {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [selectedSupplier, setSelectedSupplier] = useState(null);

  // RTK Queries & Mutations
  const { data: suppliers = [], isLoading: suppliersLoading } = useGetAdminSuppliersQuery();
  const { data: orders = [], isLoading: ordersLoading } = useGetOrdersQuery();
  const [toggleUserStatus] = useToggleUserStatusMutation();

  const isLoading = suppliersLoading || ordersLoading;

  const handleToggleBlock = async (e, supplierRecord) => {
    e.stopPropagation();
    const userId = supplierRecord.user?._id || supplierRecord.user?.id || supplierRecord.user;
    if (!userId) {
      toast({ title: "Failed", description: "Supplier user ID not found", variant: "destructive" });
      return;
    }
    const currentStatus = supplierRecord.user?.status || "active";
    const nextStatus = currentStatus === "active" ? "suspended" : "active";
    
    try {
      await toggleUserStatus({ id: userId, status: nextStatus }).unwrap();
      toast({ title: nextStatus === "suspended" ? "Supplier Suspended 🚫" : "Supplier Activated ✅" });
    } catch (error) {
      toast({
        title: "Action failed",
        description: error?.data?.error || error?.message || "Could not update status",
        variant: "destructive"
      });
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const term = search.toLowerCase();
    const matchesName = (s.businessName || s.business_name || "").toLowerCase().includes(term);
    const matchesArea = (s.area || "").toLowerCase().includes(term);
    return !search || matchesName || matchesArea;
  });

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Filtering suppliers registry...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Manage Suppliers</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {suppliers.length} total registered suppliers
          </p>
        </div>
        <div className="flex items-center gap-2">
           <Badge className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 text-xs font-bold">
             {suppliers.filter(s => (s.isActive || s.available) && s.user?.status !== "suspended").length} Active
           </Badge>
           <Badge className="px-3 py-1 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/10 text-xs font-bold">
             {suppliers.filter(s => s.user?.status === "suspended").length} Suspended
           </Badge>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
        <Input 
          placeholder="Search by supplier brand name or serviced area..." 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl h-11 bg-[#0e142e]/60 border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
        />
      </motion.div>

      {/* Suppliers List */}
      {filteredSuppliers.length === 0 ? (
        <div className="text-center py-20 bg-[#0e142e]/30 border border-white/5 rounded-3xl shadow-lg">
          <Truck className="h-12 w-12 mx-auto text-slate-600 mb-3" />
          <p className="font-bold text-lg text-white">No suppliers found</p>
          <p className="text-sm text-slate-500 mt-1">Try a different search term</p>
        </div>
      ) : (
        <div className="grid gap-4.5">
          {filteredSuppliers.map((s) => {
            const supplierId = s.id || s._id;
            const supplierOrders = orders.filter(o => {
              const oSuppId = o.supplier?._id || o.supplier;
              return oSuppId === (s.user?._id || s.user?.id || s.user);
            });
            const revenue = supplierOrders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.totalAmount || o.total_amount || 0), 0);
            const recentOrder = supplierOrders[0];
            const isSuspended = s.user?.status === "suspended";

            return (
              <motion.div 
                key={supplierId} 
                variants={item} 
                onClick={() => setSelectedSupplier(s)}
                className="bg-[#0e142e]/60 border border-white/5 rounded-2xl overflow-hidden hover:shadow-xl hover:border-blue-500/10 transition-all duration-300 cursor-pointer shadow-md"
              >
                <div className="p-5">
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
                    {/* Supplier Info */}
                    <div className="flex items-start gap-4 min-w-0">
                      <div className="h-14 w-14 rounded-2xl bg-blue-600/10 flex items-center justify-center text-2xl shrink-0 border border-blue-500/10">
                        🚛
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-bold text-white text-base truncate">{s.businessName || s.business_name}</h3>
                          {isSuspended && <Badge className="bg-rose-500/15 border border-rose-500/10 text-rose-400 text-[9px] font-bold py-0.5 rounded px-2">Suspended</Badge>}
                          <Badge className={`rounded text-[9px] py-0.5 px-2 font-bold ${s.isActive || s.available ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/10" : "bg-slate-500/10 text-slate-400 border border-slate-500/10"}`}>
                            {s.isActive || s.available ? "Online" : "Offline"}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-400 font-semibold mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-slate-500" />{s.area || "No area set"}</span>
                          <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />{Number(s.rating || 0).toFixed(1)}</span>
                          <span className="text-slate-300">Stock: {s.stock ?? 0}</span>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-3 flex-1 lg:max-w-md w-full">
                      <div className="bg-[#090d22]/50 border border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Orders</p>
                        <p className="font-bold text-white text-base mt-0.5">{supplierOrders.length}</p>
                      </div>
                      <div className="bg-[#090d22]/50 border border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Revenue</p>
                        <p className="font-bold text-white text-base mt-0.5">₹{revenue > 1000 ? (revenue / 1000).toFixed(1) + "K" : revenue.toLocaleString()}</p>
                      </div>
                      <div className="bg-[#090d22]/50 border border-white/5 rounded-xl p-2.5 text-center">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Growth</p>
                        <p className="font-bold text-emerald-400 text-base mt-0.5 flex items-center justify-center gap-0.5">
                          <TrendingUp className="h-3.5 w-3.5" />
                          {supplierOrders.length > 0 ? "8%" : "0%"}
                        </p>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 shrink-0 w-full lg:w-auto">
                      <Button 
                        size="sm" 
                        variant={isSuspended ? "default" : "destructive"} 
                        className={`gap-1.5 rounded-xl flex-1 shadow-sm h-9 font-bold text-xs ${
                          isSuspended 
                            ? "bg-emerald-600 hover:bg-emerald-500 text-white" 
                            : "bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/10 hover:border-rose-600"
                        }`}
                        onClick={(e) => handleToggleBlock(e, s)}
                      >
                        {isSuspended ? <><ShieldCheck className="h-3.5 w-3.5" /> Unsuspend</> : <><ShieldBan className="h-3.5 w-3.5" /> Suspend</>}
                      </Button>
                    </div>
                  </div>

                  {/* Activity Bar */}
                  <div className="mt-5 pt-4 border-t border-white/5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                        <Clock className="h-3.5 w-3.5" /> Recent Activity
                      </p>
                      {recentOrder && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          Last order {new Date(recentOrder.createdAt || recentOrder.created_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {recentOrder ? (
                      <div className="flex items-center justify-between p-3 rounded-xl bg-[#090d22]/40 border border-white/5 hover:bg-[#090d22]/60 transition-colors">
                        <div className="flex items-center gap-3">
                          <Package className="h-4 w-4 text-blue-400" />
                          <div>
                            <p className="text-xs font-semibold text-white">Order #{recentOrder._id.slice(-8).toUpperCase()}</p>
                            <p className="text-[10px] text-slate-500 mt-0.5">₹{Number(recentOrder.totalAmount || recentOrder.total_amount).toLocaleString()} · {recentOrder.status.replace(/_/g, ' ')}</p>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-500" />
                      </div>
                    ) : (
                      <p className="text-xs text-slate-500 italic py-1 font-semibold">No recent activity recorded.</p>
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
        <DialogContent className="sm:max-w-xl rounded-3xl p-0 overflow-hidden border border-white/10 bg-[#090d22] shadow-2xl text-slate-200">
          {selectedSupplier && (
            <div className="flex flex-col">
              {/* Cover/Header */}
              <div className="h-32 bg-gradient-to-br from-blue-600 via-sky-600 to-indigo-600 p-6 relative">
                <div className="absolute inset-0 opacity-15 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent" />
                <div className="relative z-10 flex items-center gap-4 mt-8">
                  <div className="h-20 w-20 rounded-2xl bg-[#090d22] shadow-xl flex items-center justify-center text-3xl border-4 border-[#090d22]">
                    🚛
                  </div>
                  <div className="text-white">
                    <h2 className="text-2xl font-bold font-heading">{selectedSupplier.businessName || selectedSupplier.business_name}</h2>
                    <p className="text-white/80 text-sm flex items-center gap-1.5 mt-0.5 font-semibold">
                      <MapPin className="h-3.5 w-3.5 text-blue-400" /> {selectedSupplier.area || "No area"}, {selectedSupplier.pincode || "No Pincode"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-6 pt-12 space-y-6">
                {/* Contact Section */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/10">
                      <User className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Owner Name</p>
                      <p className="text-sm font-semibold truncate text-white">{selectedSupplier.user?.name || "Not Provided"}</p>
                    </div>
                  </div>
                  <div className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                    <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/10">
                      <Phone className="h-5 w-5 text-indigo-400" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Contact No</p>
                      <p className="text-sm font-semibold text-white">{selectedSupplier.user?.phone || "Not Provided"}</p>
                    </div>
                  </div>
                  <div className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex items-center gap-3 shadow-md">
                    <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0 border border-violet-500/10">
                      <Mail className="h-5 w-5 text-violet-400" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Email Address</p>
                      <p className="text-sm font-semibold truncate text-white" title={selectedSupplier.user?.email}>
                        {selectedSupplier.user?.email || "Not Provided"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Business Details */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Building className="h-3.5 w-3.5 text-blue-400" /> Business Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3.5 rounded-xl bg-[#0e142e]/40 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Water Type</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedSupplier.waterType || selectedSupplier.water_type || "RO Purified"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0e142e]/40 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Delivery Time</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedSupplier.deliveryTime || selectedSupplier.delivery_time || "30-45 min"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0e142e]/40 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Vehicle No</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedSupplier.vehicleNumber || selectedSupplier.vehicle_number || "N/A"}</p>
                    </div>
                    <div className="p-3.5 rounded-xl bg-[#0e142e]/40 border border-white/5">
                      <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Driver Contact</p>
                      <p className="text-sm font-bold text-white mt-0.5">{selectedSupplier.driverPhone || selectedSupplier.driver_phone || "N/A"}</p>
                    </div>
                  </div>
                </div>

                {/* Pricing & Stock */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Info className="h-3.5 w-3.5 text-blue-400" /> Pricing & Inventory
                  </h4>
                  <div className="flex gap-4">
                    <div className="flex-1 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 text-center">
                      <p className="text-xs text-blue-400 font-semibold">Can Price</p>
                      <p className="text-2xl font-bold text-white mt-1">₹{Number(selectedSupplier.pricePerCan ?? selectedSupplier.price_per_can ?? 0)}</p>
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-indigo-500/5 border border-indigo-500/10 text-center">
                      <p className="text-xs text-indigo-400 font-semibold">Tanker Price</p>
                      <p className="text-2xl font-bold text-white mt-1">₹{Number(selectedSupplier.pricePerTanker ?? selectedSupplier.price_per_tanker ?? 0)}</p>
                    </div>
                    <div className="flex-1 p-4 rounded-2xl bg-[#0e142e]/80 border border-white/5 text-center">
                      <p className="text-xs text-slate-400 font-semibold">Stock</p>
                      <p className="text-2xl font-bold text-white mt-1">{selectedSupplier.stock ?? 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex pt-2">
                  <Button className="w-full rounded-xl h-11 bg-blue-600 hover:bg-blue-500 text-white font-bold" onClick={() => setSelectedSupplier(null)}>
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
