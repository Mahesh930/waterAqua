import { Package, CheckCircle, Truck, IndianRupee } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { supplierOrders, statusLabels, statusColors } from "@/lib/mock-data";

export default function SupplierHome() {
  const pending = supplierOrders.filter(o => o.status === "placed").length;
  const active = supplierOrders.filter(o => o.status === "confirmed" || o.status === "out_for_delivery").length;
  const delivered = supplierOrders.filter(o => o.status === "delivered").length;
  const revenue = supplierOrders.reduce((s, o) => s + o.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Supplier Dashboard</h2>
        <p className="text-muted-foreground text-sm">Overview of your orders and performance.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: Package, label: "Pending", value: pending, color: "text-warning" },
          { icon: Truck, label: "Active", value: active, color: "text-primary" },
          { icon: CheckCircle, label: "Delivered", value: delivered, color: "text-success" },
          { icon: IndianRupee, label: "Revenue", value: `₹${revenue}`, color: "text-accent" },
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

      <div>
        <h3 className="font-heading font-semibold text-lg mb-3">Recent Orders</h3>
        <div className="space-y-3">
          {supplierOrders.slice(0, 3).map(order => (
            <Card key={order.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <p className="font-medium">{order.customerName}</p>
                  <p className="text-sm text-muted-foreground">{order.quantity} cans · ₹{order.totalAmount}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                  {statusLabels[order.status]}
                </span>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
