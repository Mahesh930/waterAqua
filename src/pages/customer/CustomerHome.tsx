import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ShoppingBag, Truck, Clock, ArrowRight, Droplets, MapPin, Star, Navigation, Zap, Shield, ChevronRight, Package, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { useCart } from "@/hooks/use-cart";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  out_for_delivery: "On the Way 🚛",
  delivered: "Delivered ✅",
  cancelled: "Cancelled",
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

const productCategories = [
  { icon: "🍶", label: "Water Bottles", desc: "5L & 10L", color: "from-blue-500/20 to-blue-400/5", path: "/customer/products?cat=bottle" },
  { icon: "🪣", label: "Water Cans", desc: "20L Standard", color: "from-emerald-500/20 to-emerald-400/5", path: "/customer/products?cat=can" },
  { icon: "🫙", label: "Water Jars", desc: "15L Premium", color: "from-violet-500/20 to-violet-400/5", path: "/customer/products?cat=jar" },
  { icon: "🚛", label: "Tanker Delivery", desc: "5000L+ Bulk", color: "from-amber-500/20 to-amber-400/5", path: "/customer/products?cat=tanker" },
];

export default function CustomerHome() {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const { totalItems } = useCart();

  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area)")
        .eq("customer_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel("customer-home-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: `customer_id=eq.${user.id}` },
        () => { queryClient.invalidateQueries({ queryKey: ["customer-orders"] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user, queryClient]);

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const totalSpent = orders.filter(o => o.status === "delivered").reduce((sum, o) => sum + Number(o.total_amount), 0);

  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: orders.length, gradient: "from-blue-500/20 via-blue-400/10 to-transparent", iconBg: "bg-blue-500/15", iconColor: "text-blue-500" },
    { icon: Truck, label: "Active", value: activeOrders.length, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
    { icon: Clock, label: "Delivered", value: orders.filter(o => o.status === "delivered").length, gradient: "from-violet-500/20 via-violet-400/10 to-transparent", iconBg: "bg-violet-500/15", iconColor: "text-violet-500" },
    { icon: Droplets, label: "Total Spent", value: `₹${totalSpent}`, gradient: "from-amber-500/20 via-amber-400/10 to-transparent", iconBg: "bg-amber-500/15", iconColor: "text-amber-500" },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-8">
      {/* Hero Banner */}
      <motion.div variants={item}
        className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-blue-600 to-accent p-6 sm:p-8 text-primary-foreground">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-4 right-4 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-10 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 right-1/3 h-24 w-24 rounded-full bg-accent/30 blur-2xl" />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <div className="h-8 w-8 rounded-lg bg-white/20 backdrop-blur flex items-center justify-center">
              <Droplets className="h-4 w-4" />
            </div>
            <span className="text-xs font-medium bg-white/15 backdrop-blur px-2.5 py-0.5 rounded-full">
              {activeOrders.length > 0 ? `${activeOrders.length} active order${activeOrders.length > 1 ? "s" : ""}` : "Fresh water, delivered fast"}
            </span>
          </div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold mt-3">
            Hello{profile?.full_name ? `, ${profile.full_name.split(" ")[0]}` : ""}! 💧
          </h2>
          <p className="text-sm sm:text-base text-white/80 mt-1 max-w-md">
            Get fresh water products delivered to your doorstep. Bottles, cans, jars & tankers.
          </p>
          <div className="flex gap-3 mt-5">
            <Link to="/customer/products">
              <Button size="lg" className="rounded-xl bg-white text-primary hover:bg-white/90 shadow-lg gap-2 font-semibold">
                <Package className="h-4 w-4" /> Browse Products
              </Button>
            </Link>
            {totalItems > 0 && (
              <Link to="/customer/cart">
                <Button size="lg" variant="outline" className="rounded-xl border-white/30 text-white hover:bg-white/10 gap-2">
                  <ShoppingCart className="h-4 w-4" /> Cart ({totalItems})
                </Button>
              </Link>
            )}
          </div>
        </div>
      </motion.div>

      {/* Product Categories */}
      <motion.div variants={item}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-lg">Water Products</h3>
          <Link to="/customer/products" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
            View All <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {productCategories.map((cat, i) => (
            <Link key={cat.label} to={cat.path}>
              <motion.div
                whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
                className={`glass-card rounded-2xl p-4 cursor-pointer group hover:shadow-xl transition-all bg-gradient-to-br ${cat.color}`}>
                <span className="text-3xl">{cat.icon}</span>
                <p className="font-heading font-semibold text-sm mt-2">{cat.label}</p>
                <p className="text-[11px] text-muted-foreground">{cat.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>
      </motion.div>

      {/* Quick Actions */}
      <motion.div variants={item}>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { icon: Droplets, label: "Quick Order", desc: "Book directly", path: "/customer/order", color: "from-primary to-blue-600", ring: "ring-primary/20" },
            { icon: Star, label: "Find Suppliers", desc: "Browse & compare", path: "/customer/suppliers", color: "from-accent to-teal-600", ring: "ring-accent/20" },
            { icon: Navigation, label: "Track Order", desc: "Live status", path: "/customer/track", color: "from-violet-500 to-purple-600", ring: "ring-violet-500/20" },
            { icon: Clock, label: "Order History", desc: "Past deliveries", path: "/customer/history", color: "from-amber-500 to-orange-600", ring: "ring-amber-500/20" },
          ].map((action) => (
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
            <h3 className="font-heading font-semibold text-lg">Active Orders</h3>
            <Link to="/customer/track" className="text-xs text-primary font-medium flex items-center gap-1 hover:underline">
              Track All <ChevronRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {activeOrders.slice(0, 3).map((order, i) => (
              <motion.div key={order.id}
                initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                className="glass-card rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex items-center p-4">
                  <div className="flex items-center gap-3 flex-1">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-xl shrink-0">
                      🚛
                    </div>
                    <div className="min-w-0">
                      <p className="font-heading font-semibold text-sm truncate">{(order as any).suppliers?.business_name ?? "Supplier"}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                        <span>{order.quantity} {order.quantity > 1 ? "units" : "unit"}</span>
                        <span>·</span>
                        <span className="font-medium text-foreground">₹{Number(order.total_amount)}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1.5 rounded-xl text-[11px] font-semibold border ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                    <Link to="/customer/track">
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </Link>
                  </div>
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

      {/* Trust Badges */}
      <motion.div variants={item} className="glass-card rounded-2xl p-5">
        <div className="grid grid-cols-3 gap-4 text-center">
          {[
            { icon: Shield, label: "Verified Suppliers", desc: "All suppliers verified" },
            { icon: Zap, label: "Fast Delivery", desc: "30-45 min average" },
            { icon: Star, label: "Top Rated", desc: "4.5+ avg rating" },
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
    </motion.div>
  );
}
