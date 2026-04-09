import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { IndianRupee, TrendingUp, Package, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("supplier_id", supplier!.id)
        .eq("status", "delivered")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!supplier,
  });

  // Get unique months
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

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h2 className="font-heading text-3xl font-bold mb-1">Payment History</h2>
          <p className="text-muted-foreground">Track your earnings from delivered orders.</p>
        </motion.div>
        <Select value={monthFilter} onValueChange={setMonthFilter}>
          <SelectTrigger className="w-44 rounded-xl"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Time</SelectItem>
            {months.map(m => (
              <SelectItem key={m} value={m}>
                {new Date(m + "-01").toLocaleDateString("en-IN", { month: "long", year: "numeric" })}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-success/20 to-success/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><IndianRupee className="h-6 w-6 text-success" /></div>
            <div><p className="text-sm text-muted-foreground">Total Revenue</p><p className="text-2xl font-heading font-bold">₹{totalRevenue}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-primary/20 to-primary/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><Package className="h-6 w-6 text-primary" /></div>
            <div><p className="text-sm text-muted-foreground">Orders Completed</p><p className="text-2xl font-heading font-bold">{filtered.length}</p></div>
          </div>
        </div>
        <div className="glass-card rounded-2xl p-5 bg-gradient-to-br from-accent/20 to-accent/5">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-card/50 flex items-center justify-center"><TrendingUp className="h-6 w-6 text-accent" /></div>
            <div><p className="text-sm text-muted-foreground">Cans Delivered</p><p className="text-2xl font-heading font-bold">{totalCans}</p></div>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No delivered orders found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
              className="glass-card rounded-2xl p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                  <Calendar className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Order {order.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">
                    {order.quantity} cans · {new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
              </div>
              <span className="font-heading font-bold text-success">₹{Number(order.total_amount)}</span>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
