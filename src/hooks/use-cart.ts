import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { getProductImageUrl } from "@/lib/product-images";

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  supplier_id: string;
  quantity: number;
  product?: {
    id: string;
    name: string;
    category: string;
    size_liters: number;
    price: number;
    image_url: string | null;
    supplier_id: string;
    suppliers?: { business_name: string; area: string; pincode: string | null };
  };
}

export function useCart() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cart_items")
        .select("*, product:products(id, name, category, size_liters, price, image_url, supplier_id, suppliers(business_name, area, pincode))")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return ((data as any[]) || []).map(item => ({
        ...item,
        product: item.product
          ? {
              ...item.product,
              image_url: getProductImageUrl(item.product),
            }
          : item.product,
      })) as CartItem[];
    },
    enabled: !!user,
  });

  const addToCart = useMutation({
    mutationFn: async ({ productId, supplierId, qty = 1 }: { productId: string; supplierId: string; qty?: number }) => {
      // Upsert: if exists, increment quantity
      const existing = items.find(i => i.product_id === productId);
      if (existing) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existing.quantity + qty } as any)
          .eq("id", existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").insert({
          user_id: user!.id,
          product_id: productId,
          supplier_id: supplierId,
          quantity: qty,
        } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cart"] });
      toast({ title: "Added to cart 🛒" });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const updateQty = useMutation({
    mutationFn: async ({ itemId, quantity }: { itemId: string; quantity: number }) => {
      if (quantity <= 0) {
        const { error } = await supabase.from("cart_items").delete().eq("id", itemId);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("cart_items").update({ quantity } as any).eq("id", itemId);
        if (error) throw error;
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const clearCart = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("cart_items").delete().eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["cart"] }),
  });

  const totalItems = items.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0);

  return { items, isLoading, addToCart, updateQty, clearCart, totalItems, totalPrice };
}
