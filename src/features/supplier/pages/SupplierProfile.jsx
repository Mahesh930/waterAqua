import React, { useState, useEffect } from "react";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Button } from "@/ui/button";
import { Star, Truck, Phone, Hash, Droplets, Navigation, MapPin, Save, Shield, CheckCircle2, Locate } from "lucide-react";
import { useToast } from "@/shared/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useGetMySupplierQuery, useUpdateSupplierMutation, useGetSupplierFeedbackQuery } from "@/store/api";
import { motion } from "framer-motion";
import { usePincode } from "@/shared/hooks/use-pincode";
import ServiceAreaManager from "@/features/supplier/components/ServiceAreaManager";
import { Switch } from "@/ui/switch";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function SupplierProfile() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { lookup, data: pincodeData, loading: pincodeLoading } = usePincode();

  // RTK Queries & Mutations
  const { data: supplier, isLoading: supplierLoading } = useGetMySupplierQuery();
  const [updateSupplier] = useUpdateSupplierMutation();
  const { data: feedbacks = [] } = useGetSupplierFeedbackQuery(supplier?.id || supplier?._id, {
    skip: !supplier
  });

  const [form, setForm] = useState({
    business_name: "", area: "", price_per_can: 40, price_per_tanker: 500,
    water_type: "RO Purified", stock: 0, delivery_time: "30-45 min",
    tanker_capacity: 5000, driver_phone: "", vehicle_number: "", pincode: "", available: true,
    latitude: null, longitude: null,
    address: "",
  });

  useEffect(() => {
    if (supplier) {
      setForm({
        business_name: supplier.businessName || supplier.business_name || "",
        area: supplier.area || "",
        price_per_can: Number(supplier.pricePerCan ?? supplier.price_per_can ?? 40),
        price_per_tanker: Number(supplier.pricePerTanker ?? supplier.price_per_tanker ?? 500),
        water_type: supplier.waterType || supplier.water_type || "RO Purified",
        stock: Number(supplier.stock ?? 0),
        delivery_time: supplier.deliveryTime || supplier.delivery_time || "30-45 min",
        tanker_capacity: Number(supplier.tankerCapacity ?? supplier.tanker_capacity ?? 5000),
        driver_phone: supplier.driverPhone || supplier.driver_phone || "",
        vehicle_number: supplier.vehicleNumber || supplier.vehicle_number || "",
        pincode: supplier.pincode || "",
        available: supplier.isActive !== undefined ? supplier.isActive : (supplier.available ?? true),
        latitude: supplier.latitude || null,
        longitude: supplier.longitude || null,
        address: supplier.address || "",
      });
    }
  }, [supplier]);

  useEffect(() => {
    if (form.pincode.length === 6) {
      lookup(form.pincode);
    }
  }, [form.pincode, lookup]);

  useEffect(() => {
    if (pincodeData) {
      setForm(prev => ({
        ...prev,
        area: `${pincodeData.area}, ${pincodeData.city}, ${pincodeData.district}`
      }));
    }
  }, [pincodeData]);

  const handleSave = async () => {
    if (!supplier) return;
    try {
      await updateSupplier(form).unwrap();
      toast({ title: "Profile updated! ✅" });
    } catch (error) {
      toast({
        title: "Update failed",
        description: error?.data?.error || error?.message || "An error occurred",
        variant: "destructive"
      });
    }
  };

  const handleSetLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: "GPS not supported", variant: "destructive" });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm(prev => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
        toast({ title: "Current location set!", description: "Save to update your business coordinates." });
      },
      () => toast({ title: "Location access denied", variant: "destructive" })
    );
  };

  if (supplierLoading || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400">Loading profile...</p>
      </div>
    );
  }

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto text-slate-200">
      {/* Profile Header */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-3xl overflow-hidden shadow-lg">
        <div className="h-24 bg-gradient-to-br from-blue-600 via-sky-500 to-indigo-600 relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          </div>
        </div>
        <div className="px-5 pb-5 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-[#090d22] border-4 border-[#090d22] shadow-lg flex items-center justify-center text-3xl">🚛</div>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">{supplier.businessName || supplier.business_name}</h2>
              <p className="text-sm text-slate-400 flex items-center gap-1 mt-1">
                <MapPin className="h-3.5 w-3.5 text-blue-400" /> {supplier.area || "No area set"}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#0e142e] border border-white/5 px-2.5 py-1 rounded-xl">
                <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                <span className="font-bold text-white text-sm">{Number(supplier.rating || 0).toFixed(1)}</span>
              </div>
              <span className="text-xs text-slate-500">({supplier.reviewCount || supplier.review_count || 0})</span>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Stock", value: `${supplier.stock ?? 0} cans`, color: "text-blue-400" },
              { label: "Can Price", value: `₹${Number(supplier.pricePerCan ?? supplier.price_per_can ?? 0)}`, color: "text-emerald-400" },
              { label: "Tanker Price", value: `₹${Number(supplier.pricePerTanker ?? supplier.price_per_tanker ?? 0)}`, color: "text-indigo-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#090d22]/80 border border-white/5 rounded-2xl p-3 text-center">
                <p className={`font-bold text-lg ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Availability Toggle */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 flex items-center justify-between shadow-md">
        <div>
          <h3 className="font-bold text-white text-base">Availability</h3>
          <p className="text-xs text-slate-500 mt-0.5">Toggle to go online/offline for new orders</p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-xs font-bold ${form.available ? "text-emerald-400" : "text-slate-500"}`}>
            {form.available ? "🟢 Online" : "⚫ Offline"}
          </span>
          <Switch checked={form.available} onCheckedChange={v => setForm({ ...form, available: v })} />
        </div>
      </motion.div>

      {/* Business Details */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
        <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-2">
          <Shield className="h-4 w-4 text-blue-400" /> Business Details
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-400">Business Name</Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.business_name} onChange={e => setForm({ ...form, business_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400 flex items-center gap-1">
              <Navigation className="h-3 w-3 text-blue-400" /> Pincode
            </Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" placeholder="6-digit pincode" maxLength={6}
              value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value.replace(/\D/g, "").slice(0, 6) })} />
            {pincodeLoading && <p className="text-[10px] text-blue-400 animate-pulse mt-1">Looking up...</p>}
            {pincodeData && (
              <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />{pincodeData.area}, {pincodeData.city}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Service Area (Auto-completed or customized)</Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.area} onChange={e => setForm({ ...form, area: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400">Full Business Address (Manual)</Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" placeholder="e.g. Shop No. 4, MG Road, Bangalore" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Water Type</Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.water_type} onChange={e => setForm({ ...form, water_type: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Stock (cans)</Label>
            <Input type="number" className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.stock} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400">Delivery Time</Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.delivery_time} onChange={e => setForm({ ...form, delivery_time: e.target.value })} />
          </div>
          <div className="flex flex-col justify-end">
            <Label className="text-xs mb-1 text-slate-400">Business Geolocation</Label>
            <Button variant="outline" size="sm" onClick={handleSetLocation} className="rounded-xl gap-2 h-10 border-dashed border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 text-white border-white/5">
              <Locate className="h-4 w-4 text-blue-400" />
              {form.latitude ? `${Number(form.latitude).toFixed(4)}, ${Number(form.longitude).toFixed(4)}` : "Update GPS Coordinates"}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Pricing */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
        <h3 className="font-bold text-white text-base border-b border-white/5 pb-2">💰 Pricing</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="bg-[#090d22]/60 border border-white/5 rounded-2xl p-4 text-center">
            <Droplets className="h-5 w-5 text-blue-400 mx-auto mb-2" />
            <Label className="text-xs text-slate-400">Price per Can (₹)</Label>
            <Input type="number" className="mt-2 rounded-xl text-center text-lg font-bold bg-[#090d22] border-white/5 text-white" value={form.price_per_can} onChange={e => setForm({ ...form, price_per_can: Number(e.target.value) })} />
          </div>
          <div className="bg-[#090d22]/60 border border-white/5 rounded-2xl p-4 text-center">
            <Truck className="h-5 w-5 text-indigo-400 mx-auto mb-2" />
            <Label className="text-xs text-slate-400">Price per Tanker (₹)</Label>
            <Input type="number" className="mt-2 rounded-xl text-center text-lg font-bold bg-[#090d22] border-white/5 text-white" value={form.price_per_tanker} onChange={e => setForm({ ...form, price_per_tanker: Number(e.target.value) })} />
          </div>
        </div>
      </motion.div>

      {/* Tanker & Driver */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
        <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-2">
          <Truck className="h-4 w-4 text-blue-400" /> Vehicle & Driver
        </h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <Label className="text-xs text-slate-400 flex items-center gap-1">
              <Droplets className="h-3 w-3 text-blue-400" /> Tanker Capacity (L)
            </Label>
            <Input type="number" className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" value={form.tanker_capacity} onChange={e => setForm({ ...form, tanker_capacity: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs text-slate-400 flex items-center gap-1">
              <Phone className="h-3 w-3 text-blue-400" /> Driver Phone
            </Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" placeholder="+91 98765 43210" value={form.driver_phone} onChange={e => setForm({ ...form, driver_phone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label className="text-xs text-slate-400 flex items-center gap-1">
              <Hash className="h-3 w-3 text-blue-400" /> Vehicle Number
            </Label>
            <Input className="mt-1 rounded-xl bg-[#090d22] border-white/5 text-white" placeholder="MH 12 AB 1234" value={form.vehicle_number} onChange={e => setForm({ ...form, vehicle_number: e.target.value })} />
          </div>
        </div>
      </motion.div>

      {/* Service Areas */}
      {supplier && (
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 shadow-md">
          <ServiceAreaManager supplierId={supplier.id || supplier._id} />
        </motion.div>
      )}

      <motion.div variants={item}>
        <Button onClick={handleSave} className="rounded-xl w-full h-12 text-base font-semibold gap-2 bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/10" size="lg">
          <Save className="h-4 w-4" /> Save All Changes
        </Button>
      </motion.div>

      {/* Reviews */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
        <h3 className="font-bold text-white text-base flex items-center gap-2 border-b border-white/5 pb-2">
          <Star className="h-4 w-4 text-amber-500" /> Customer Reviews ({feedbacks.length})
        </h3>
        {feedbacks.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-6">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {feedbacks.slice(0, 10).map(f => (
              <div key={f.id || f._id} className="bg-[#090d22]/50 border border-white/5 rounded-xl p-4">
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < f.rating ? "fill-amber-500 text-amber-500" : "text-slate-700"}`} />
                  ))}
                  <span className="text-xs text-slate-500 ml-2">
                    {new Date(f.createdAt || f.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                  </span>
                  {f.customer && (
                    <span className="text-xs text-slate-400 ml-auto font-semibold">
                      - {f.customer.name}
                    </span>
                  )}
                </div>
                {f.comment && <p className="text-sm text-slate-400">{f.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
