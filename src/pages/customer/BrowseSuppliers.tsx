import { useState } from "react";
import { Star, MapPin, Clock, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { suppliers } from "@/lib/mock-data";
import { useNavigate } from "react-router-dom";

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const filtered = suppliers.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.area.toLowerCase().includes(search.toLowerCase()) ||
    s.waterType.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Browse Suppliers</h2>
        <p className="text-muted-foreground text-sm">Find trusted water suppliers near you.</p>
      </div>

      <Input placeholder="Search by name, area, or water type..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(s => (
          <Card key={s.id} className={`hover:shadow-md transition-shadow ${!s.available ? "opacity-60" : ""}`}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="text-3xl">{s.image}</div>
                {!s.available && <Badge variant="secondary">Unavailable</Badge>}
              </div>
              <h3 className="font-heading font-semibold text-base mb-1">{s.name}</h3>
              <div className="space-y-1 text-sm text-muted-foreground mb-3">
                <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {s.area}</div>
                <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> {s.waterType}</div>
                <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {s.deliveryTime}</div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-warning text-warning" />
                  <span className="font-medium text-sm">{s.rating}</span>
                  <span className="text-xs text-muted-foreground">({s.reviewCount})</span>
                </div>
                <span className="font-heading font-bold text-primary">₹{s.pricePerCan}/can</span>
              </div>
              {s.available && (
                <Button size="sm" className="w-full mt-3" onClick={() => navigate(`/customer/order?supplier=${s.id}`)}>Order Now</Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
