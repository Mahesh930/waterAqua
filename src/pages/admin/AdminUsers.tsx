import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { UserCheck, Ban, Star } from "lucide-react";

const customers = [
  { id: "1", name: "Rahul Sharma", email: "rahul@email.com", orders: 12, status: "active" },
  { id: "2", name: "Priya Patel", email: "priya@email.com", orders: 8, status: "active" },
  { id: "3", name: "Arjun Reddy", email: "arjun@email.com", orders: 3, status: "active" },
  { id: "4", name: "Meera Iyer", email: "meera@email.com", orders: 0, status: "blocked" },
];

const suppliersData = [
  { id: "1", name: "PureFlow Water Co.", area: "Koramangala", rating: 4.8, status: "verified" },
  { id: "2", name: "AquaPure Solutions", area: "Indiranagar", rating: 4.6, status: "verified" },
  { id: "3", name: "FreshDrop Delivery", area: "Whitefield", rating: 4.4, status: "pending" },
];

export default function AdminUsers() {
  const { toast } = useToast();

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Users & Suppliers</h2>
        <p className="text-muted-foreground text-sm">Manage all platform users.</p>
      </div>

      <Tabs defaultValue="customers">
        <TabsList>
          <TabsTrigger value="customers">Customers ({customers.length})</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers ({suppliersData.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-3 mt-4">
          {customers.map(c => (
            <Card key={c.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{c.name}</span>
                    <Badge variant={c.status === "active" ? "default" : "destructive"}>{c.status}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.email} · {c.orders} orders</p>
                </div>
                <Button size="sm" variant={c.status === "active" ? "destructive" : "default"}
                  onClick={() => toast({ title: `User ${c.status === "active" ? "blocked" : "activated"}` })}>
                  {c.status === "active" ? <><Ban className="h-3.5 w-3.5 mr-1" /> Block</> : <><UserCheck className="h-3.5 w-3.5 mr-1" /> Activate</>}
                </Button>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="suppliers" className="space-y-3 mt-4">
          {suppliersData.map(s => (
            <Card key={s.id}>
              <CardContent className="flex items-center justify-between p-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{s.name}</span>
                    <Badge variant={s.status === "verified" ? "default" : "secondary"}>{s.status}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <span>{s.area}</span>
                    <span className="flex items-center gap-1"><Star className="h-3.5 w-3.5 fill-warning text-warning" /> {s.rating}</span>
                  </div>
                </div>
                {s.status === "pending" && (
                  <Button size="sm" onClick={() => toast({ title: "Supplier verified!" })}>
                    <UserCheck className="h-3.5 w-3.5 mr-1" /> Verify
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
