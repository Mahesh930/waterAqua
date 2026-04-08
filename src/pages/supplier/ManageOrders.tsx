import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierOrders as initialOrders, statusLabels, statusColors, Order } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";
import { Check, X, Truck, MapPin } from "lucide-react";

export default function ManageOrders() {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [filter, setFilter] = useState("all");
  const { toast } = useToast();

  const filtered = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const updateStatus = (id: string, status: Order["status"]) => {
    setOrders(prev => prev.map(o => o.id === id ? { ...o, status } : o));
    toast({ title: "Status Updated", description: `Order ${id} → ${statusLabels[status]}` });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-heading text-2xl font-bold mb-1">Manage Orders</h2>
          <p className="text-muted-foreground text-sm">Accept, reject, and update order statuses.</p>
        </div>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="placed">Pending</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        {filtered.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.customerName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{order.id}</p>
                </div>
                <span className="font-heading font-bold text-primary">₹{order.totalAmount}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{order.quantity} cans</span>
                <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{order.customerAddress}</span>
              </div>
              <div className="flex gap-2">
                {order.status === "placed" && (
                  <>
                    <Button size="sm" onClick={() => updateStatus(order.id, "confirmed")} className="gap-1"><Check className="h-3.5 w-3.5" /> Accept</Button>
                    <Button size="sm" variant="destructive" onClick={() => updateStatus(order.id, "cancelled")} className="gap-1"><X className="h-3.5 w-3.5" /> Reject</Button>
                  </>
                )}
                {order.status === "confirmed" && (
                  <Button size="sm" onClick={() => updateStatus(order.id, "out_for_delivery")} className="gap-1"><Truck className="h-3.5 w-3.5" /> Dispatch</Button>
                )}
                {order.status === "out_for_delivery" && (
                  <Button size="sm" variant="outline" onClick={() => updateStatus(order.id, "delivered")} className="gap-1"><Check className="h-3.5 w-3.5" /> Mark Delivered</Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <p className="text-center text-muted-foreground py-8">No orders found.</p>}
      </div>
    </div>
  );
}
