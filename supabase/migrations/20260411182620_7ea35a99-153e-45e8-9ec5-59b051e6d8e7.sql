
-- Products table for multiple water product sizes
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'can',
  size_liters NUMERIC NOT NULL DEFAULT 20,
  price NUMERIC NOT NULL DEFAULT 40,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can browse products" ON public.products
  FOR SELECT USING (true);

CREATE POLICY "Suppliers can insert their own products" ON public.products
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
  );

CREATE POLICY "Suppliers can update their own products" ON public.products
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
  );

CREATE POLICY "Suppliers can delete their own products" ON public.products
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
  );

CREATE INDEX idx_products_supplier ON public.products(supplier_id);
CREATE INDEX idx_products_category ON public.products(category);

-- Cart items table
CREATE TABLE public.cart_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own cart" ON public.cart_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can add to cart" ON public.cart_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their cart" ON public.cart_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from cart" ON public.cart_items
  FOR DELETE USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON public.cart_items
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
