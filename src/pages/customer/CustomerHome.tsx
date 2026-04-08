import { Link } from "react-router-dom";
import { ShoppingBag, Truck, Clock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const statusColors: Record<string, string> = {
  placed: "bg-warning/10 text-warning",
  confirmed: "bg-primary/10 text-primary",
  out_for_delivery: "bg-accent/10 text-accent",
  delivered: "bg-success/10 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};

const statusLabels: Record<string, string> = {
  placed: "Order Placed",
  confirmed: "Confirmed",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export default function CustomerHome() {
  const { user, profile } = useAuth();

  const { data: orders = [] } = useQuery({
    queryKey: ["customer-orders", user?.id],
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

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">
          Welcome back{profile?.full_name ? `, ${profile.full_name}` : ""}! 👋
        </h2>
        <p className="text-muted-foreground text-sm">Here's your water delivery overview.</p>
      </div>

      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { icon: ShoppingBag, label: "Total Orders", value: orders.length, color: "text-primary" },
          { icon: Truck, label: "Active Orders", value: activeOrders.length, color: "text-accent" },
          { icon: Clock, label: "Delivered", value: orders.filter(o => o.status === "delivered").length, color: "text-success" },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">{s.label}</p>
                <p className="text-2xl font-heading font-bold">{s.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {activeOrders.length > 0 && (
        <div>
          <h3 className="font-heading font-semibold text-lg mb-3">Active Orders</h3>
          <div className="space-y-3">
            {activeOrders.map(order => (
              <Card key={order.id}>
                <CardContent className="flex items-center justify-between p-4">
                  <div>
                    <p className="font-medium">{order.suppliers?.business_name ?? "Unknown"}</p>
                    <p className="text-sm text-muted-foreground">{order.quantity} cans · ₹{order.total_amount}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3">
        <Link to="/customer/suppliers"><Button>Browse Suppliers</Button></Link>
        <Link to="/customer/order"><Button variant="outline">Place Order</Button></Link>
      </div>
    </div>
  );
}
