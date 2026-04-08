import { Card, CardContent } from "@/components/ui/card";
import { supplierOrders, customerOrders, statusLabels, statusColors } from "@/lib/mock-data";

const allOrders = [...customerOrders, ...supplierOrders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

export default function AdminOrders() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">All Orders</h2>
        <p className="text-muted-foreground text-sm">Monitor all platform orders.</p>
      </div>

      <div className="space-y-3">
        {allOrders.map(order => (
          <Card key={order.id}>
            <CardContent className="flex items-center justify-between p-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{order.id}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                    {statusLabels[order.status]}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {order.customerName || "Customer"} → {order.supplierName} · {order.quantity} cans
                </p>
              </div>
              <span className="font-heading font-bold text-primary">₹{order.totalAmount}</span>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
