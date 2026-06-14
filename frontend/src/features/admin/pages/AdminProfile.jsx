import React, { useState, useEffect } from "react";
import { User, Shield, Activity, Clock, Edit2, Save, Mail, Phone, MapPin, Lock, CheckCircle2 } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useGetMeQuery, useUpdateProfileMutation, useGetAdminOverviewQuery } from "@/store/api";
import { useToast } from "@/shared/hooks/use-toast";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function AdminProfile() {
  const { toast } = useToast();
  
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");

  // RTK Queries
  const { data: meData, isLoading: meLoading } = useGetMeQuery();
  const { data: overviewData = {}, isLoading: overviewLoading } = useGetAdminOverviewQuery();
  const [updateProfile, { isLoading: saving }] = useUpdateProfileMutation();

  const user = meData?.user || {};

  useEffect(() => {
    if (user) {
      setFullName(user.name || "");
      setPhone(user.phone || "");
      setAddress(user.address || "");
      setPincode(user.pincode || "");
    }
  }, [meData]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: fullName,
        phone,
        address,
        pincode
      }).unwrap();

      toast({ title: "Admin profile updated successfully! ✅" });
      setEditing(false);
    } catch (e) {
      toast({
        title: "Update failed",
        description: e?.data?.error || "Error saving profile details",
        variant: "destructive"
      });
    }
  };

  if (meLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-3">
        <div className="animate-spin h-10 w-10 border-4 border-blue-500 border-t-transparent rounded-full" />
        <p className="text-sm text-slate-400 font-semibold">Loading profile information...</p>
      </div>
    );
  }

  const statItems = [
    { label: "Platform Users", value: overviewData.totalUsers ?? 0, color: "text-violet-400" },
    { label: "Active Suppliers", value: overviewData.activeSuppliers ?? 0, color: "text-indigo-400" },
    { label: "Orders Managed", value: overviewData.totalOrders ?? 0, color: "text-blue-400" },
    { label: "Commissions", value: `₹${Math.round(overviewData.totalCommissions ?? 0).toLocaleString("en-IN")}`, color: "text-emerald-400" }
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 text-slate-200">
      {/* Title */}
      <motion.div variants={item} className="flex flex-col gap-1">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Admin Profile</h1>
        <p className="text-slate-400 text-sm">Manage your personal settings and monitor system privileges</p>
      </motion.div>

      {/* Profile summary card */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-3xl overflow-hidden shadow-lg relative">
        <div className="h-24 bg-gradient-to-r from-violet-600 via-indigo-600 to-blue-600 relative">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/20 blur-xl" />
          </div>
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-[#090d22] border-4 border-[#070b19] shadow-lg flex items-center justify-center text-3xl select-none">
            🛡️
          </div>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{user.name || "Administrator"}</h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1 text-sm text-slate-400">
                <span className="flex items-center gap-1"><Mail className="h-3.5 w-3.5 text-slate-500" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone className="h-3.5 w-3.5 text-slate-500" /> {user.phone}</span>}
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300 hover:text-white" 
              onClick={() => setEditing(!editing)}
            >
              <Edit2 className="h-3.5 w-3.5 mr-1.5" /> {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {statItems.map(s => (
              <div key={s.label} className="bg-[#090d22] border border-white/5 rounded-xl p-3.5 text-center">
                <p className={`font-black text-lg ${s.color}`}>
                  {overviewLoading ? (
                    <span className="inline-block h-5 w-8 bg-white/5 animate-pulse rounded" />
                  ) : (
                    s.value
                  )}
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Settings Panel */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Side: Profile Form */}
        <motion.div variants={item} className="lg:col-span-2 bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-2">
            <User className="h-4 w-4 text-blue-400" /> Account Details
          </h3>
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</Label>
                <Input 
                  value={fullName} 
                  onChange={e => setFullName(e.target.value)} 
                  disabled={!editing} 
                  className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Phone Number</Label>
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  disabled={!editing} 
                  className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                  placeholder="+91 XXXXX XXXXX" 
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Registered Email</Label>
              <div className="relative mt-1.5">
                <Input 
                  value={user.email || ""} 
                  disabled 
                  className="rounded-xl pr-10 bg-[#090d22] border-white/5 text-white opacity-60 cursor-not-allowed" 
                />
                <Lock className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Please contact technical support to change your administrative email address</p>
            </div>

            <div className="grid md:grid-cols-3 gap-4 border-t border-white/5 pt-4">
              <div className="md:col-span-1">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pincode Area</Label>
                <Input 
                  value={pincode} 
                  onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} 
                  disabled={!editing} 
                  maxLength={6} 
                  className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                />
              </div>
              <div className="md:col-span-2">
                <Label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Address Location</Label>
                <Input 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  disabled={!editing} 
                  className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" 
                  placeholder="e.g. Office Suite 2, Main Admin Block"
                />
              </div>
            </div>
          </div>

          {editing && (
            <Button 
              className="w-full py-5 rounded-xl gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/10 border-0 mt-4" 
              onClick={handleSaveProfile} 
              disabled={saving}
            >
              <Save className="h-4 w-4" /> {saving ? "Saving Changes..." : "Save Profile Details"}
            </Button>
          )}
        </motion.div>

        {/* Right Side: Security Info */}
        <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-5 space-y-4 shadow-md h-fit">
          <h3 className="font-bold text-white text-lg flex items-center gap-2 border-b border-white/5 pb-2">
            <Shield className="h-4 w-4 text-violet-400" /> Security & Privileges
          </h3>
          <div className="space-y-4 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-violet-500/10 border border-violet-500/15 flex items-center justify-center shrink-0">
                <Shield className="h-4 w-4 text-violet-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">System Role</span>
                  <span className="px-1.5 py-0.2 bg-violet-500/10 text-violet-400 border border-violet-500/10 rounded text-[9px] font-bold uppercase tracking-wider">
                    {user.role}
                  </span>
                </div>
                <p className="text-xs text-slate-500">Root administration permissions enabled</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-emerald-500/10 border border-emerald-500/15 flex items-center justify-center shrink-0">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">Account Status</span>
                  <span className="px-1.5 py-0.2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/10 rounded text-[9px] font-bold uppercase tracking-wider">
                    Active
                  </span>
                </div>
                <p className="text-xs text-slate-500">Authenticated & authorized console session</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-lg bg-blue-500/10 border border-blue-500/15 flex items-center justify-center shrink-0">
                <Activity className="h-4 w-4 text-blue-400" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-white">Audit Logger</span>
                  <span className="px-1.5 py-0.2 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded text-[9px] font-bold uppercase tracking-wider">
                    Enabled
                  </span>
                </div>
                <p className="text-xs text-slate-500">All session actions are securely cryptographed</p>
              </div>
            </div>

            {user.createdAt && (
              <div className="flex items-start gap-3 border-t border-white/5 pt-4">
                <div className="h-8 w-8 rounded-lg bg-slate-500/10 border border-white/5 flex items-center justify-center shrink-0">
                  <Clock className="h-4 w-4 text-slate-400" />
                </div>
                <div className="space-y-0.5">
                  <p className="font-semibold text-white">Registered Since</p>
                  <p className="text-xs text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric"
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
