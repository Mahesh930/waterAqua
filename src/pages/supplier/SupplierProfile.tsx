import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Star } from "lucide-react";
import { feedbacks } from "@/lib/mock-data";
import { useToast } from "@/hooks/use-toast";

export default function SupplierProfile() {
  const { toast } = useToast();

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Supplier Profile</h2>
        <p className="text-muted-foreground text-sm">Manage your business information.</p>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Business Details</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>Business Name</Label><Input defaultValue="PureFlow Water Co." className="mt-1" /></div>
            <div><Label>Service Area</Label><Input defaultValue="Koramangala, Bangalore" className="mt-1" /></div>
            <div><Label>Price per Can (₹)</Label><Input type="number" defaultValue="40" className="mt-1" /></div>
            <div><Label>Water Type</Label><Input defaultValue="RO Purified" className="mt-1" /></div>
            <div><Label>Available Stock (cans)</Label><Input type="number" defaultValue="150" className="mt-1" /></div>
            <div><Label>Phone</Label><Input defaultValue="+91 98765 43210" className="mt-1" /></div>
          </div>
          <Button onClick={() => toast({ title: "Profile updated!" })}>Save Changes</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Customer Feedback</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {feedbacks.map(f => (
            <div key={f.id} className="p-3 rounded-lg bg-muted/50">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium text-sm">{f.customerName}</span>
                <div className="flex">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} className={`h-3.5 w-3.5 ${i < f.rating ? "fill-warning text-warning" : "text-muted"}`} />
                  ))}
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{f.comment}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
