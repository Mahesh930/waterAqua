import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Star } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";

export default function AdminUsers() {
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: suppliers = [] } = useQuery({
    queryKey: ["admin-suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase.from("suppliers").select("*");
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

  const customerProfiles = profiles.filter(p =>
    roles.some(r => r.user_id === p.user_id && r.role === "customer")
  );

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="font-heading text-3xl font-bold mb-1">Users & Suppliers</h2>
        <p className="text-muted-foreground">Manage all platform users.</p>
      </motion.div>

      <Tabs defaultValue="customers">
        <TabsList className="rounded-xl">
          <TabsTrigger value="customers" className="rounded-lg">Customers ({customerProfiles.length})</TabsTrigger>
          <TabsTrigger value="suppliers" className="rounded-lg">Suppliers ({suppliers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-3 mt-4">
          {customerProfiles.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No customers yet.</p>
          ) : (
            customerProfiles.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{c.full_name || "Unnamed"}</span>
                  <p className="text-sm text-muted-foreground">{c.phone || "No phone"}</p>
                </div>
                <Badge className="rounded-lg">Customer</Badge>
              </motion.div>
            ))
          )}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-3 mt-4">
          {suppliers.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No suppliers yet.</p>
          ) : (
            suppliers.map((s, i) => (
              <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="glass-card rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <span className="font-medium">{s.business_name}</span>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{s.area}</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {Number(s.rating).toFixed(1)}</span>
                    <span>Stock: {s.stock}</span>
                  </div>
                </div>
                <Badge variant={s.available ? "default" : "secondary"} className="rounded-lg">
                  {s.available ? "Active" : "Inactive"}
                </Badge>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
