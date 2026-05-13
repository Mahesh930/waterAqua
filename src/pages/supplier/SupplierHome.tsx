import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Package, CheckCircle, Truck, IndianRupee, ChevronRight, Clock, Star, MapPin, Droplets, Zap, Shield, TrendingUp, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  placed: "Pending",
  confirmed: "Confirmed",
  out_for_delivery: "Dispatched",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function SupplierHome() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["supplier-orders", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("supplier_id", supplier!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  // Realtime updates
  useEffect(() => {
    if (!supplier) return;
    const channel = supabase
      .channel("supplier-home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `supplier_id=eq.${supplier.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["supplier-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [supplier, queryClient]);

  const pending = orders.filter(o => o.status === "placed").length;
  const active = orders.filter(o => o.status === "confirmed" || o.status === "out_for_delivery").length;
  const delivered = orders.filter(o => o.status === "delivered").length;
  const revenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);

  const stats = [
    { icon: Package, label: "Pending Orders", value: pending, gradient: "from-warning/20 via-warning/10 to-transparent", iconBg: "bg-warning/15", iconColor: "text-warning" },
    { icon: Truck, label: "In Transit", value: active, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
    { icon: CheckCircle, label: "Delivered", value: delivered, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
    { icon: IndianRupee, label: "Revenue", value: `₹${revenue}`, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
  ];

  const quickActions = [
    { icon: Package, label: "Products", desc: "Manage catalog", path: "/supplier/products", color: "from-blue-500 to-cyan-600", ring: "ring-blue-500/20" },
    { icon: ClipboardList, label: "Orders", desc: "Accept & dispatch", path: "/supplier/orders", color: "from-primary to-blue-600", ring: "ring-primary/20" },
    { icon: IndianRupee, label: "Payments", desc: "Track earnings", path: "/supplier/payments", color: "from-emerald-500 to-teal-600", ring: "ring-emerald-500/20" },
    { icon: TrendingUp, label: "Reports", desc: "Analytics & trends", path: "/supplier/reports", color: "from-violet-500 to-purple-600", ring: "ring-violet-500/20" },
    { icon: Star, label: "Profile", desc: "Business settings", path: "/supplier/profile", color: "from-amber-500 to-orange-600", ring: "ring-amber-500/20" },
  ];

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Hero Banner */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-accent p-6 sm:p-8 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Truck className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium bg-white/15 backdrop-blur px-2.5 py-0.5 rounded-full">
              {pending > 0 ? `${pending} pending order${pending > 1 ? "s" : ""}` : "All caught up!"}
            </span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-3">
            Welcome back{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}!
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 max-w-md">
            {supplier?.business_name ? `Managing ${supplier.business_name}` : "Manage your water delivery business"}
            {supplier?.area ? ` · ${supplier.area}` : ""}
          </p>
          <div className="flex gap-3 mt-5">
            <Link to="/supplier/orders">
              <Button size="lg" className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold">
                <Package className="h-4 w-4" /> View Orders
              </Button>
            </Link>
            <Link to="/supplier/profile">
              <Button size="lg" variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 gap-2">
                Edit Profile
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {quickActions.map(action => (
            <Link key={action.path} to={action.path}>
              <motion.div 
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className={`glass-card rounded-2xl p-4 cursor-pointer group hover:shadow-xl transition-all duration-300 ring-1 ${action.ring} ring-inset`}>
                <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="h-5 w-5 text-white" />
                </div>
                <p className="font-heading font-semibold text-sm">{action.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{action.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item}>
        <h3 className="font-heading font-semibold text-lg mb-3">Your Overview</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.label} className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${s.gradient} relative overflow-hidden`}>
              <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
                <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
              </div>
              <p className="text-2xl font-heading font-bold">{s.value}</p>
              <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Active Orders */}
      {activeOrders.length > 0 && (
        <motion.div variants={item}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-heading font-semibold text-lg">Recent Orders</h3>
            <Link to="/supplier/orders" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              View All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 5).map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex items-center p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm">Order #{order.id.slice(0, 8)}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{order.quantity} units</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">₹{Number(order.total_amount)}</span>
                        {order.delivery_address && (
                          <>
                            <span>·</span>
                            <span className="flex items-center gap-0.5 truncate max-w-[120px]"><MapPin className="h-3 w-3 shrink-0" />{order.delivery_address}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <div className="h-1 bg-muted">
                  <motion.div
                    className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                    initial={{ width: "0%" }}
                    animate={{
                      width: order.status === "placed" ? "25%" :
                             order.status === "confirmed" ? "50%" :
                             order.status === "out_for_delivery" ? "75%" : "100%"
                    }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Business Info Card */}
      {supplier && (
        <motion.div variants={item} className="glass-card rounded-2xl p-5">
          <div className="grid grid-cols-3 gap-4 text-center">
            {[
              { icon: Shield, label: "Verified Business", desc: supplier.business_name },
              { icon: Zap, label: "Delivery Time", desc: supplier.delivery_time },
              { icon: Star, label: "Rating", desc: `${Number(supplier.rating).toFixed(1)} Rating` },
            ].map(badge => (
              <div key={badge.label} className="flex flex-col items-center gap-1.5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <badge.icon className="h-5 w-5 text-primary" />
                </div>
                <p className="font-heading font-semibold text-xs">{badge.label}</p>
                <p className="text-[10px] text-muted-foreground">{badge.desc}</p>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
