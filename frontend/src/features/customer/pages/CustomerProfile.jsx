import React, { useState, useEffect } from "react";
import { User, IndianRupee, Settings, Gift, ShoppingBag, Edit2, Save, Share2, Copy, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useGetOrdersQuery, useUpdateProfileMutation, useGetMeQuery } from "@/store/api";
import { useToast } from "@/shared/hooks/use-toast";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

const statusColors = {
  placed: "bg-amber-500/10 text-amber-400 border-amber-500/10",
  confirmed: "bg-blue-500/10 text-blue-400 border-blue-500/10",
  out_for_delivery: "bg-teal-500/10 text-teal-400 border-teal-500/10",
  delivered: "bg-emerald-500/10 text-emerald-400 border-emerald-500/10",
  cancelled: "bg-rose-500/10 text-rose-400 border-rose-500/10",
};

export default function CustomerProfile() {
  const { profile } = useAuth();
  const { toast } = useToast();
  
  const [tab, setTab] = useState("orders");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [copied, setCopied] = useState(false);

  // RTK Queries
  const { data: meData } = useGetMeQuery();
  const { data: orders = [] } = useGetOrdersQuery();
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

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const totalSpent = deliveredOrders.reduce((s, o) => s + Number(o.totalAmount), 0);

  const totalPages = Math.ceil(orders.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = startIdx + itemsPerPage;
  const paginatedOrders = orders.slice(startIdx, endIdx);

  useEffect(() => {
    setCurrentPage(1);
  }, [tab, orders.length]);

  const handleSaveProfile = async () => {
    try {
      await updateProfile({
        name: fullName,
        phone,
        address,
        pincode
      }).unwrap();

      toast({ title: "Profile updated ✅" });
      setEditing(false);
    } catch (e) {
      toast({
        title: "Update failed",
        description: e?.data?.error || "Error saving profile details",
        variant: "destructive"
      });
    }
  };

  const referralCode = `AQUA${user._id ? user._id.slice(-4).toUpperCase() : "0000"}`;
  const referralCredits = 100; // Seed default credit rewards

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Referral code copied!" });
  };

  const tabs = [
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "payments", label: "Payments", icon: IndianRupee },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "referrals", label: "Refer & Earn", icon: Gift },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto text-slate-200">
      {/* Profile summary card */}
      <motion.div variants={item} className="bg-[#0e142e]/60 border border-white/5 rounded-3xl overflow-hidden shadow-lg relative">
        <div className="h-24 bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 relative">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/20 blur-xl" />
          </div>
        </div>
        <div className="px-6 pb-6 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-[#090d22] border-4 border-[#070b19] shadow-lg flex items-center justify-center text-3xl select-none">
            👤
          </div>
          <div className="mt-4 flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white tracking-tight">{user.name || "Customer"}</h2>
              <p className="text-sm text-slate-400">{user.email}</p>
              {user.phone && <p className="text-xs text-slate-400 mt-1">📞 {user.phone}</p>}
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300 hover:text-white" 
              onClick={() => setEditing(!editing)}
            >
              <Edit2 className="h-3 w-3 mr-1" /> {editing ? "Cancel" : "Edit Profile"}
            </Button>
          </div>
          
          <div className="grid grid-cols-4 gap-3 mt-6">
            {[
              { label: "Orders Placed", value: orders.length, color: "text-blue-400" },
              { label: "Delivered", value: deliveredOrders.length, color: "text-emerald-400" },
              { label: "Total Spent", value: `₹${totalSpent}`, color: "text-teal-400" },
              { label: "Credits", value: `₹${referralCredits}`, color: "text-amber-400" },
            ].map(s => (
              <div key={s.label} className="bg-[#090d22] border border-white/5 rounded-xl p-3.5 text-center">
                <p className={`font-black text-lg ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Navigation tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
        {tabs.map(t => (
          <button 
            key={t.key} 
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key 
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                : "bg-[#0e142e] border border-white/5 text-slate-400 hover:text-white"
            }`}
          >
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab contexts */}
      <motion.div variants={item}>
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16 bg-[#0e142e]/30 border border-white/5 rounded-2xl">
                <ShoppingBag className="h-10 w-10 mx-auto text-slate-600 mb-3" />
                <p className="text-sm text-slate-500 font-semibold">No orders placed yet</p>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between px-1">
                  <p className="text-xs text-slate-500 font-semibold">
                    Showing {startIdx + 1}-{Math.min(endIdx, orders.length)} of {orders.length} order{orders.length !== 1 ? "s" : ""}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <Button variant="outline" size="sm" className="h-7 px-2"
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}>
                      <ChevronLeft className="h-3 w-3" />
                    </Button>
                    <div className="text-[10px] font-semibold px-1 text-slate-400">
                      Page {currentPage} of {Math.max(1, totalPages)}
                    </div>
                    <Button variant="outline" size="sm" className="h-7 px-2"
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}>
                      <ChevronRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {paginatedOrders.map(order => (
                  <div key={order.id || order._id} className="bg-[#0e142e]/60 border border-white/5 rounded-2xl p-4 flex items-center justify-between shadow-md">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-base shrink-0">
                        🚛
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-white text-sm truncate">{order.supplier?.name || "Water Distributor"}</p>
                        <p className="text-xs text-slate-400 mt-0.5">{order.products?.reduce((s, p) => s + p.quantity, 0) || 1} units · ₹{Number(order.totalAmount)}</p>
                        <p className="text-[9px] text-slate-500 font-semibold">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border uppercase tracking-wider shrink-0 ${statusColors[order.status]}`}>
                      {order.status}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-4">
            <div className="p-5 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg space-y-4">
              <h3 className="font-bold text-white text-lg">Payments Ledger</h3>
              <div className="space-y-2.5 text-sm">
                <div className="flex justify-between"><span className="text-slate-400 font-semibold">Total Spent</span><span className="font-black text-white">₹{totalSpent}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-semibold">Orders Completed</span><span className="font-black text-white">{deliveredOrders.length}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-semibold">Avg. Order bill</span><span className="font-black text-white">₹{deliveredOrders.length > 0 ? Math.round(totalSpent / deliveredOrders.length) : 0}</span></div>
                <div className="flex justify-between"><span className="text-slate-400 font-semibold">Earned Credits</span><span className="font-black text-amber-400">₹{referralCredits}</span></div>
              </div>
            </div>
            {deliveredOrders.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Delivery Ledger Transcripts</h4>
                {deliveredOrders.slice(0, 5).map(o => (
                  <div key={o.id || o._id} className="p-4 bg-[#0e142e]/40 border border-white/5 rounded-xl flex items-center justify-between shadow-md">
                    <div>
                      <p className="text-sm font-bold text-white">{o.supplier?.name || "Water Distributor"}</p>
                      <p className="text-[10px] text-slate-500 font-semibold">{new Date(o.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className="font-black text-emerald-400 text-base">₹{Number(o.totalAmount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="p-5 bg-[#0e142e]/60 border border-white/5 rounded-2xl shadow-lg space-y-4">
            <h3 className="font-bold text-white text-lg">Account Profile Settings</h3>
            <div className="space-y-3.5">
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase">Full Name</Label>
                <Input value={fullName} onChange={e => setFullName(e.target.value)} disabled={!editing} className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase">Phone Number</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" placeholder="+91 XXXXX XXXXX" />
              </div>
              <div>
                <Label className="text-xs font-bold text-slate-500 uppercase">Registered Email</Label>
                <Input value={user.email || ""} disabled className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white opacity-60 cursor-not-allowed" />
              </div>
              <div className="grid grid-cols-1 gap-3 border-t border-white/5 pt-3">
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Pincode Area</Label>
                  <Input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, "").slice(0, 6))} disabled={!editing} maxLength={6} className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" />
                </div>
                <div>
                  <Label className="text-xs font-bold text-slate-500 uppercase">Delivery Address</Label>
                  <Input value={address} onChange={e => setAddress(e.target.value)} disabled={!editing} className="rounded-xl mt-1.5 bg-[#090d22] border-white/5 text-white focus-visible:ring-blue-500" />
                </div>
              </div>
            </div>
            {editing && (
              <Button className="w-full py-5 rounded-xl gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-lg shadow-blue-600/10 border-0 mt-4" onClick={handleSaveProfile} disabled={saving}>
                <Save className="h-4 w-4" /> {saving ? "Saving..." : "Save Changes"}
              </Button>
            )}
          </div>
        )}

        {tab === "referrals" && (
          <div className="space-y-4">
            <div className="p-6 bg-[#0e142e]/60 border border-white/5 rounded-2xl text-center shadow-lg space-y-4">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/10 to-teal-500/10 border border-blue-500/10 flex items-center justify-center mb-1">
                <Gift className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white tracking-tight">Refer & Hydrate</h3>
              <p className="text-sm text-slate-400 max-w-sm mx-auto leading-relaxed">Share your unique code with neighbors and earn 50 Rs credit on their first verified water jar delivery!</p>
              
              <div className="mt-5 p-4 bg-[#090d22] border border-white/5 rounded-2xl">
                <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Your Personal Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="text-2xl font-black text-blue-400 tracking-widest">{referralCode}</span>
                  <Button size="sm" variant="outline" className="rounded-xl border-white/10 hover:bg-white/5 text-slate-300" onClick={copyReferral}>
                    {copied ? <CheckCircle2 className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>
            </div>

            <div className="p-5 bg-[#0e142e]/60 border border-white/5 rounded-2xl space-y-4 shadow-lg">
              <h4 className="font-bold text-white">How it works</h4>
              <div className="space-y-4">
                {[
                  { step: "1", title: "Share your code", desc: "Copy and send your custom code to friends." },
                  { step: "2", title: "They order water jars", desc: "Friends sign up with your code and place an order." },
                  { step: "3", title: "Both earn credits!", desc: "Credits are instantly unlocked when their OTP is verified." },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-500/10 border border-blue-500/15 flex items-center justify-center text-xs font-bold text-blue-400 shrink-0">
                      {s.step}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">{s.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">{s.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full py-6 rounded-xl gap-2 bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold shadow-xl shadow-blue-500/20 border-0" onClick={copyReferral}>
              <Share2 className="h-4 w-4" /> Share My Referral Code
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
