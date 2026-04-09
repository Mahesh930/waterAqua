import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Package, Calendar, ChevronRight } from "lucide-react";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

export default function PaymentHistory() {
  const { user } = useAuth();
  const [monthFilter, setMonthFilter] = useState("all");

  const { data: supplier } = useQuery({
    queryKey: ["my-supplier", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*").eq("user_id", user!.id).single();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["supplier-delivered-orders", supplier?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("supplier_id", supplier!.id).eq("status", "delivered").order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  const months = [...new Set(orders.map(o => {
    const d = new Date(o.created_at);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }))];

  const filtered = monthFilter === "all" ? orders : orders.filter(o => {
    const d = new Date(o.created_at);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}` === monthFilter;
  });

  const totalRevenue = filtered.reduce((s, o) => s + Number(o.total_amount), 0);
  const totalCans = filtered.reduce((s, o) => s + o.quantity, 0);
  const avgOrder = filtered.length > 0 ? Math.round(totalRevenue / filtered.length) : 0;

  const monthTabs = [{ key: "all", label: "All Time" }, ...months.map(m => ({
    key: m, label: new Date(m + "-01").toLocaleDateString("en-IN", { month: "short", year: "numeric" }),
  }))];

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item}>
        <h2 className="font-heading text-2xl sm:text-3xl font-bold">Payment History</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Track your earnings from delivered orders</p>
      </motion.div>

      {/* Month Filter Tabs */}
      <motion.div variants={item} className="flex gap-1.5 overflow-x-auto pb-1">
        {monthTabs.map(t => (
          <button key={t.key} onClick={() => setMonthFilter(t.key)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              monthFilter === t.key ? "bg-primary text-primary-foreground shadow-md shadow-primary/20" : "glass text-muted-foreground hover:text-foreground"
            }`}>{t.label}</button>
        ))}
      </motion.div>

      {/* Stats */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {[
          { icon: IndianRupee, label: "Revenue", value: `₹${totalRevenue}`, gradient: "from-emerald-500/20 via-emerald-400/10 to-transparent", iconBg: "bg-emerald-500/15", iconColor: "text-emerald-500" },
          { icon: Package, label: "Orders", value: filtered.length, gradient: "from-primary/20 via-primary/10 to-transparent", iconBg: "bg-primary/15", iconColor: "text-primary" },
          { icon: TrendingUp, label: "Avg Order", value: `₹${avgOrder}`, gradient: "from-accent/20 via-accent/10 to-transparent", iconBg: "bg-accent/15", iconColor: "text-accent" },
        ].map(s => (
          <div key={s.label} className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${s.gradient}`}>
            <div className={`h-9 w-9 rounded-xl ${s.iconBg} flex items-center justify-center mb-2`}>
              <s.icon className={`h-4.5 w-4.5 ${s.iconColor}`} />
            </div>
            <p className="text-2xl font-heading font-bold">{s.value}</p>
            <p className="text-[11px] text-muted-foreground font-medium">{s.label}</p>
          </div>
        ))}
      </motion.div>

      {/* Transactions */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full" />
          <p className="text-sm text-muted-foreground">Loading payments...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="h-20 w-20 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
            <IndianRupee className="h-10 w-10 text-muted-foreground/30" />
          </div>
          <p className="font-heading font-semibold text-lg">No payments yet</p>
          <p className="text-sm text-muted-foreground mt-1">Completed orders will appear here</p>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-muted-foreground font-medium">{filtered.length} transaction{filtered.length !== 1 ? "s" : ""}</p>
          {filtered.map((order, i) => (
            <motion.div key={order.id} variants={item}
              className="glass-card rounded-2xl p-4 flex items-center gap-3 hover:shadow-lg transition-shadow">
              <div className="h-11 w-11 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <Calendar className="h-5 w-5 text-success" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-sm">Order #{order.id.slice(0, 8)}</p>
                <p className="text-xs text-muted-foreground">
                  {order.quantity} units · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>
              <span className="font-heading font-bold text-success text-lg">+₹{Number(order.total_amount)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}
