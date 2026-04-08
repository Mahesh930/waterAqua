import { useState } from "react";
import { Star, MapPin, Clock, Droplets } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

export default function BrowseSuppliers() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: suppliers = [], isLoading } = useQuery({
    queryKey: ["suppliers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("suppliers")
        .select("*")
        .order("rating", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const filtered = suppliers.filter(s =>
    s.business_name.toLowerCase().includes(search.toLowerCase()) ||
    s.area.toLowerCase().includes(search.toLowerCase()) ||
    s.water_type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-bold mb-1">Browse Suppliers</h2>
        <p className="text-muted-foreground text-sm">Find trusted water suppliers near you.</p>
      </div>

      <Input placeholder="Search by name, area, or water type..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-md" />

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Droplets className="h-10 w-10 mx-auto mb-3 opacity-40" />
          <p>No suppliers found. Try a different search.</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(s => (
            <Card key={s.id} className={`hover:shadow-md transition-shadow ${!s.available ? "opacity-60" : ""}`}>
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="text-3xl">💧</div>
                  {!s.available && <Badge variant="secondary">Unavailable</Badge>}
                </div>
                <h3 className="font-heading font-semibold text-base mb-1">{s.business_name}</h3>
                <div className="space-y-1 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {s.area}</div>
                  <div className="flex items-center gap-1.5"><Droplets className="h-3.5 w-3.5" /> {s.water_type}</div>
                  <div className="flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {s.delivery_time}</div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-warning text-warning" />
                    <span className="font-medium text-sm">{Number(s.rating).toFixed(1)}</span>
                    <span className="text-xs text-muted-foreground">({s.review_count})</span>
                  </div>
                  <span className="font-heading font-bold text-primary">₹{Number(s.price_per_can)}/can</span>
                </div>
                {s.available && (
                  <Button size="sm" className="w-full mt-3" onClick={() => navigate(`/customer/order?supplier=${s.id}`)}>Order Now</Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
