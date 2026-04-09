import { useState, useEffect } from "react";
import { User, Clock, IndianRupee, Settings, Gift, ShoppingBag, Edit2, Save, Share2, Copy, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

type Tab = "orders" | "payments" | "settings" | "referrals";

export default function CustomerProfile() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>("orders");
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || "");
  const [phone, setPhone] = useState(profile?.phone || "");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || "");
      setPhone(profile.phone || "");
    }
  }, [profile]);

  // Fetch profile with referral data
  const { data: profileData } = useQuery({
    queryKey: ["my-profile-referral", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("referral_code, referral_credits")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Fetch referrals made by this user
  const { data: referrals = [] } = useQuery({
    queryKey: ["my-referrals", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const referralCode = (profileData as any)?.referral_code || user?.id?.slice(0, 8).toUpperCase() || "AQUA0000";
  const referralCredits = Number((profileData as any)?.referral_credits || 0);

  const { data: orders = [] } = useQuery({
    queryKey: ["profile-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const deliveredOrders = orders.filter(o => o.status === "delivered");
  const totalSpent = deliveredOrders.reduce((s, o) => s + Number(o.total_amount), 0);

  const handleSaveProfile = async () => {
    if (!user) return;
    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName, phone } as any)
      .eq("user_id", user.id);
    if (error) toast({ title: "Update failed", description: error.message, variant: "destructive" });
    else { toast({ title: "Profile updated ✅" }); setEditing(false); }
  };

  const copyReferral = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: "Referral code copied!" });
  };

  const tabs: { key: Tab; label: string; icon: typeof User }[] = [
    { key: "orders", label: "Orders", icon: ShoppingBag },
    { key: "payments", label: "Payments", icon: IndianRupee },
    { key: "settings", label: "Settings", icon: Settings },
    { key: "referrals", label: "Refer & Earn", icon: Gift },
  ];

  const statusColors: Record<string, string> = {
    placed: "bg-warning/10 text-warning",
    confirmed: "bg-primary/10 text-primary",
    out_for_delivery: "bg-accent/10 text-accent",
    delivered: "bg-success/10 text-success",
    cancelled: "bg-destructive/10 text-destructive",
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <motion.div variants={item} className="glass-card rounded-3xl overflow-hidden">
        <div className="h-24 bg-gradient-to-br from-primary via-blue-600 to-accent relative">
          <div className="absolute inset-0 opacity-20">
            <div className="absolute top-2 right-8 h-20 w-20 rounded-full bg-white/20 blur-2xl" />
          </div>
        </div>
        <div className="px-5 pb-5 -mt-10 relative">
          <div className="h-20 w-20 rounded-2xl bg-card border-4 border-background shadow-lg flex items-center justify-center text-3xl">👤</div>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h2 className="font-heading text-xl font-bold">{profile?.full_name || "Customer"}</h2>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              {profile?.phone && <p className="text-xs text-muted-foreground mt-0.5">📞 {profile.phone}</p>}
            </div>
            <Button variant="outline" size="sm" className="rounded-xl glass gap-1.5" onClick={() => setEditing(!editing)}>
              <Edit2 className="h-3 w-3" /> Edit
            </Button>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4">
            {[
              { label: "Orders", value: orders.length, color: "text-primary" },
              { label: "Delivered", value: deliveredOrders.length, color: "text-success" },
              { label: "Spent", value: `₹${totalSpent}`, color: "text-accent" },
              { label: "Credits", value: `₹${referralCredits}`, color: "text-warning" },
            ].map(s => (
              <div key={s.label} className="glass rounded-xl p-3 text-center">
                <p className={`font-heading font-bold text-lg ${s.color}`}>{s.value}</p>
                <p className="text-[10px] text-muted-foreground">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
        {tabs.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              tab === t.key ? "bg-primary text-primary-foreground shadow-md" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="h-3.5 w-3.5" /> {t.label}
          </button>
        ))}
      </motion.div>

      {/* Tab Content */}
      <motion.div variants={item}>
        {tab === "orders" && (
          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="text-center py-16 glass-card rounded-2xl">
                <ShoppingBag className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No orders yet</p>
              </div>
            ) : orders.map(order => (
              <div key={order.id} className="glass-card rounded-2xl p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">🚛</div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{(order as any).suppliers?.business_name || "Supplier"}</p>
                  <p className="text-xs text-muted-foreground">{order.quantity} units · ₹{Number(order.total_amount)}</p>
                  <p className="text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold ${statusColors[order.status]}`}>
                  {order.status.replace(/_/g, " ")}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === "payments" && (
          <div className="space-y-3">
            <div className="glass-card rounded-2xl p-5">
              <h3 className="font-heading font-semibold mb-3">Payment Summary</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Total Spent</span><span className="font-bold text-primary">₹{totalSpent}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Orders Paid</span><span className="font-medium">{deliveredOrders.length}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Avg. Order</span><span className="font-medium">₹{deliveredOrders.length > 0 ? Math.round(totalSpent / deliveredOrders.length) : 0}</span></div>
                <div className="flex justify-between text-sm"><span className="text-muted-foreground">Referral Credits</span><span className="font-bold text-warning">₹{referralCredits}</span></div>
              </div>
            </div>
            {deliveredOrders.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Recent Payments</h4>
                {deliveredOrders.slice(0, 10).map(o => (
                  <div key={o.id} className="glass-card rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium">{(o as any).suppliers?.business_name}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("en-IN")}</p>
                    </div>
                    <span className="font-heading font-bold text-success">₹{Number(o.total_amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "settings" && (
          <div className="glass-card rounded-2xl p-5 space-y-4">
            <h3 className="font-heading font-semibold">Account Settings</h3>
            <div className="space-y-3">
              <div><label className="text-xs font-medium text-muted-foreground">Full Name</label><Input value={fullName} onChange={e => setFullName(e.target.value)} disabled={!editing} className="rounded-xl mt-1" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Phone</label><Input value={phone} onChange={e => setPhone(e.target.value)} disabled={!editing} className="rounded-xl mt-1" placeholder="+91 XXXXX XXXXX" /></div>
              <div><label className="text-xs font-medium text-muted-foreground">Email</label><Input value={user?.email || ""} disabled className="rounded-xl mt-1 opacity-60" /></div>
            </div>
            {editing && (
              <Button className="w-full rounded-xl gap-2" onClick={handleSaveProfile}>
                <Save className="h-4 w-4" /> Save Changes
              </Button>
            )}
          </div>
        )}

        {tab === "referrals" && (
          <div className="space-y-4">
            <div className="glass-card rounded-2xl p-5 text-center">
              <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-3">
                <Gift className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-heading text-lg font-bold">Refer & Earn</h3>
              <p className="text-sm text-muted-foreground mt-1">Share your code with friends and earn ₹50 on their first delivered order!</p>
              
              <div className="mt-5 glass rounded-2xl p-4">
                <p className="text-xs text-muted-foreground mb-1.5">Your Referral Code</p>
                <div className="flex items-center justify-center gap-3">
                  <span className="font-heading text-2xl font-bold text-primary tracking-widest">{referralCode}</span>
                  <Button size="sm" variant="outline" className="rounded-xl gap-1.5" onClick={copyReferral}>
                    {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="glass rounded-xl p-3 text-center">
                  <p className="font-heading font-bold text-lg text-primary">{referrals.length}</p>
                  <p className="text-[10px] text-muted-foreground">Referrals</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="font-heading font-bold text-lg text-success">{referrals.filter((r: any) => r.status === "credited").length}</p>
                  <p className="text-[10px] text-muted-foreground">Credited</p>
                </div>
                <div className="glass rounded-xl p-3 text-center">
                  <p className="font-heading font-bold text-lg text-warning">₹{referralCredits}</p>
                  <p className="text-[10px] text-muted-foreground">Earned</p>
                </div>
              </div>
            </div>

            {/* Referral History */}
            {referrals.length > 0 && (
              <div className="glass-card rounded-2xl p-5">
                <h4 className="font-heading font-semibold mb-3">Referral History</h4>
                <div className="space-y-2">
                  {referrals.map((r: any) => (
                    <div key={r.id} className="glass rounded-xl p-3 flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">Referral #{r.id.slice(0, 8)}</p>
                        <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleDateString("en-IN")}</p>
                      </div>
                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold ${r.status === "credited" ? "bg-success/10 text-success" : "bg-warning/10 text-warning"}`}>
                          {r.status === "credited" ? "✅ Credited" : "⏳ Pending"}
                        </span>
                        <p className="text-xs font-bold text-primary mt-0.5">₹{Number(r.reward_amount)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="glass-card rounded-2xl p-5">
              <h4 className="font-heading font-semibold mb-3">How it works</h4>
              <div className="space-y-3">
                {[
                  { step: "1", title: "Share your code", desc: "Send your referral code to friends" },
                  { step: "2", title: "They sign up & order", desc: "Friends register and place their first order" },
                  { step: "3", title: "Both earn ₹50", desc: "Credits added when their order is delivered" },
                ].map(s => (
                  <div key={s.step} className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">{s.step}</div>
                    <div><p className="text-sm font-medium">{s.title}</p><p className="text-xs text-muted-foreground">{s.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>

            <Button className="w-full rounded-xl gap-2" onClick={copyReferral}>
              <Share2 className="h-4 w-4" /> Share Referral Code
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
