import { Card, CardContent } from "@/components/ui/card";
import { customerOrders, statusLabels, statusColors } from "@/lib/mock-data";

export default function OrderHistory() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Order History</h2>
        <p className="text-muted-foreground text-sm">View all your past and current orders.</p>
      </div>

      <div className="space-y-3">
        {customerOrders.map(order => (
          <Card key={order.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{order.supplierName}</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">Order {order.id}</p>
                </div>
                <span className="font-heading font-bold text-primary">₹{order.totalAmount}</span>
              </div>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span>{order.quantity} cans</span>
                <span>·</span>
                <span>{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
