import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats, monthlyData } from "@/lib/mock-data";
import { ShoppingBag, Users, Truck, IndianRupee, TrendingUp, Star } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

export default function AdminOverview() {
  const stats = [
    { icon: ShoppingBag, label: "Total Orders", value: adminStats.totalOrders.toLocaleString(), color: "text-primary" },
    { icon: Users, label: "Active Customers", value: adminStats.activeCustomers.toLocaleString(), color: "text-accent" },
    { icon: Truck, label: "Active Suppliers", value: adminStats.activeSuppliers.toString(), color: "text-success" },
    { icon: IndianRupee, label: "Total Revenue", value: `₹${(adminStats.totalRevenue / 1000).toFixed(0)}K`, color: "text-warning" },
    { icon: TrendingUp, label: "Orders Today", value: adminStats.ordersToday.toString(), color: "text-primary" },
    { icon: Star, label: "Avg Rating", value: adminStats.avgRating.toString(), color: "text-warning" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Admin Overview</h2>
        <p className="text-muted-foreground text-sm">Platform-wide analytics and metrics.</p>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map(s => (
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

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle className="text-base">Monthly Orders</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Revenue Trend</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Line type="monotone" dataKey="revenue" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ fill: "hsl(var(--accent))" }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
