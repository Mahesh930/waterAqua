import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Package, MapPin, Clock, IndianRupee, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.04 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning border-warning/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  out_for_delivery: "bg-accent/10 text-accent border-accent/20",
  delivered: "bg-success/10 text-success border-success/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  placed: "⏳ Placed",
  confirmed: "✅ Confirmed",
  out_for_delivery: "🚛 Dispatched",
  delivered: "📦 Delivered",
  cancelled: "❌ Cancelled",
};

export default function AdminOrders() {
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-all-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, suppliers(business_name, area)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filterTabs = [
    { key: "all", label: "All", count: orders.length },
    { key: "placed", label: "Pending", count: orders.filter(o => o.status === "placed").length },
    { key: "confirmed", label: "Confirmed", count: orders.filter(o => o.status === "confirmed").length },
    { key: "out_for_delivery", label: "Dispatched", count: orders.filter(o => o.status === "out_for_delivery").length },
    { key: "delivered", label: "Delivered", count: orders.filter(o => o.status === "delivered").length },
    { key: "cancelled", label: "Cancelled", count: orders.filter(o => o.status === "cancelled").length },
  ];

  const filtered = orders
    .filter(o => filter === "all" || o.status === filter)
    .filter(o => !search || o.id.includes(search) || (o as any).suppliers?.business_name?.toLowerCase().includes(search.toLowerCase()));

  const totalValue = filtered.reduce((s, o) => s + Number(o.total_amount), 0);

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">All Orders</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{orders.length} total orders · ₹{totalValue} value</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search by order ID or supplier..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl h-11 bg-muted/30 border-0" />
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
        {filterTabs.map(t => (
          <button key={t.key} onClick={() => setFilter(t.key)}
            className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              filter === t.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
            }`}>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-md text-[10px] ${filter === t.key ? "bg-white/20" : "bg-muted"}`}>{t.count}</span>
          </button>
        ))}
      </motion.div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <Package className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No orders found</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">{filtered.length} order{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map(order => (
            <motion.div key={order.id} variants={item}
              className="glass-card rounded-2xl p-4 hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center text-lg shrink-0">📦</div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-heading font-semibold text-sm">#{order.id.slice(0, 8)}</span>
                      <span className={`px-2.5 py-0.5 rounded-lg text-[10px] font-semibold border ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span>{(order as any).suppliers?.business_name ?? "Unknown"}</span>
                      <span>·</span>
                      <span>{order.quantity} units</span>
                      <span>·</span>
                      <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</span>
                    </div>
                    {order.delivery_address && (
                      <p className="text-[10px] text-muted-foreground/70 mt-0.5 flex items-center gap-0.5">
                        <MapPin className="h-3 w-3 shrink-0" />{order.delivery_address.slice(0, 40)}{order.delivery_address.length > 40 ? "…" : ""}
                      </p>
                    )}
                  </div>
                </div>
                <span className="font-heading font-bold text-primary text-lg">₹{Number(order.total_amount)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
