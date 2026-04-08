import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Package } from "lucide-react";

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

export default function OrderHistory() {
  const { user } = useAuth();

  const { data: orders = [], isLoading } = useQuery({
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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Order History</h2>
        <p className="text-muted-foreground text-sm">View all your past and current orders.</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Package className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No orders yet. Browse suppliers to place your first order!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(order => (
            <Card key={order.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{order.suppliers?.business_name ?? "Unknown"}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                        {statusLabels[order.status]}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">Order {order.id.slice(0, 8)}</p>
                  </div>
                  <span className="font-heading font-bold text-primary">₹{Number(order.total_amount)}</span>
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>{order.quantity} cans</span>
                  <span>·</span>
                  <span>{new Date(order.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
