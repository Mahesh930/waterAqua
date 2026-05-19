import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Star, ShieldBan, ShieldCheck, Users, Truck, MapPin, Package, Search, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

const container = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const item = { hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0 } };

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");

  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-roles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("user_roles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-orders-users"],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("customer_id, supplier_id, total_amount, status");
      if (error) throw error;
      return data;
    },
  });

  const customerProfiles = profiles.filter(p =>
    roles.some(r => r.user_id === p.user_id && r.role === "customer")
  ).filter(p => !search || p.full_name?.toLowerCase().includes(search.toLowerCase()) || p.phone?.includes(search));

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={item} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h2 className="font-heading text-2xl sm:text-3xl font-bold">Customer Management</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{customerProfiles.length} registered customers</p>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div variants={item} className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)}
          className="pl-10 rounded-xl bg-muted/30 border-0" />
      </motion.div>

      {/* Customers List */}
      <div className="space-y-2">
        {customerProfiles.length === 0 ? (
          <div className="text-center py-16 glass-card rounded-2xl">
            <Users className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">No customers found</p>
          </div>
        ) : (
          customerProfiles.map((c, i) => {
            const customerOrders = orders.filter(o => o.customer_id === c.user_id);
            const spent = customerOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
            return (
              <motion.div key={c.id} variants={item}
                className="glass-card rounded-2xl p-4 flex items-center gap-3">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-lg shrink-0">👤</div>
                <div className="flex-1 min-w-0">
                  <p className="font-heading font-semibold text-sm truncate">{c.full_name || "Unnamed"}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                    {c.phone && <span className="flex items-center gap-0.5"><Phone className="h-3 w-3" />{c.phone}</span>}
                    {c.email && <span className="hidden sm:inline">·</span>}
                    {c.email && <span className="hidden sm:inline truncate max-w-[150px]">{c.email}</span>}
                    <span>·</span>
                    <span>{customerOrders.length} orders</span>
                    <span className="font-medium text-foreground">₹{spent}</span>
                  </div>
                </div>
                <Badge className="rounded-lg bg-primary/10 text-primary border-0">Customer</Badge>
              </motion.div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
