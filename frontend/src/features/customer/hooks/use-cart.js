import { useGetCartQuery, useAddToCartMutation, useUpdateCartItemMutation, useRemoveCartItemMutation, useClearCartMutation } from "@/store/api";
import { useToast } from "@/shared/hooks/use-toast";

export function useCart() {
  const { toast } = useToast();

  // RTK Query hooks
  const { data: items = [], isLoading } = useGetCartQuery();
  
  const [triggerAddToCart] = useAddToCartMutation();
  const [triggerUpdateQty] = useUpdateCartItemMutation();
  const [triggerRemoveItem] = useRemoveCartItemMutation();
  const [triggerClearCart] = useClearCartMutation();

  const addToCart = {
    mutate: async ({ productId, quantity = 1 }) => {
      try {
        await triggerAddToCart({ productId, quantity }).unwrap();
        toast({ title: "Added to cart 🛒", description: "Product added successfully." });
      } catch (e) {
        toast({ 
          title: "Failed to add", 
          description: e?.data?.error || "Error adding item to cart", 
          variant: "destructive" 
        });
      }
    }
  };

  const updateQty = {
    mutate: async ({ itemId, quantity }) => {
      try {
        if (quantity <= 0) {
          await triggerRemoveItem(itemId).unwrap();
        } else {
          await triggerUpdateQty({ id: itemId, quantity }).unwrap();
        }
      } catch (e) {
        toast({ 
          title: "Failed to update", 
          description: e?.data?.error || "Error adjusting cart quantity", 
          variant: "destructive" 
        });
      }
    }
  };

  const clearCart = {
    mutate: async () => {
      try {
        await triggerClearCart().unwrap();
      } catch (e) {
        toast({ 
          title: "Failed to clear cart", 
          description: e?.data?.error || "Error clearing cart items", 
          variant: "destructive" 
        });
      }
    }
  };

  // Map backend product model structure to what pages expect
  const mappedItems = items.map(item => ({
    id: item.id || item._id,
    product_id: item.product?.id || item.product?._id,
    supplier_id: item.supplier?.id || item.supplier?._id,
    quantity: item.quantity,
    product: item.product ? {
      id: item.product.id || item.product._id,
      name: item.product.name,
      category: item.product.category,
      price: item.product.price,
      size_liters: item.product.capacityLiters || 20,
      image_url: item.product.imageUrl || "",
      supplier_id: item.supplier?.id || item.supplier?._id,
      suppliers: {
        business_name: item.supplier?.name || "Distributor",
        area: item.supplier?.address || "Local Area",
        pincode: item.supplier?.pincode || ""
      }
    } : null
  }));

  const totalItems = mappedItems.reduce((s, i) => s + i.quantity, 0);
  const totalPrice = mappedItems.reduce((s, i) => s + (i.product?.price ?? 0) * i.quantity, 0);

  return { 
    items: mappedItems, 
    isLoading, 
    addToCart, 
    updateQty, 
    clearCart, 
    totalItems, 
    totalPrice 
  };
}
