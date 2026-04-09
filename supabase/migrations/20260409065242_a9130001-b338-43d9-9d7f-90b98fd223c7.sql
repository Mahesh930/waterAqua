
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  type TEXT NOT NULL DEFAULT 'order',
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
ON public.notifications FOR INSERT
TO authenticated
WITH CHECK (true);

-- Index for fast lookups
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Add blocked column to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT false;

-- Trigger function to create notifications on order status change
CREATE OR REPLACE FUNCTION public.notify_order_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  supplier_user_id UUID;
  supplier_name TEXT;
  status_text TEXT;
BEGIN
  -- Get supplier info
  SELECT user_id, business_name INTO supplier_user_id, supplier_name
  FROM public.suppliers WHERE id = NEW.supplier_id;

  -- Map status to readable text
  CASE NEW.status
    WHEN 'placed' THEN status_text := 'Order Placed';
    WHEN 'confirmed' THEN status_text := 'Confirmed';
    WHEN 'out_for_delivery' THEN status_text := 'Out for Delivery';
    WHEN 'delivered' THEN status_text := 'Delivered';
    WHEN 'cancelled' THEN status_text := 'Cancelled';
    ELSE status_text := NEW.status;
  END CASE;

  -- Notify customer on status change (not on initial insert)
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      NEW.customer_id,
      'Order ' || status_text,
      'Your order from ' || COALESCE(supplier_name, 'supplier') || ' is now ' || status_text || '.',
      'order',
      NEW.id
    );
  END IF;

  -- Notify supplier on new order
  IF TG_OP = 'INSERT' AND supplier_user_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, title, message, type, reference_id)
    VALUES (
      supplier_user_id,
      'New Order Received',
      'You have a new order for ' || NEW.quantity || ' cans. Total: ₹' || NEW.total_amount,
      'order',
      NEW.id
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER on_order_status_change
AFTER INSERT OR UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.notify_order_status_change();

-- Enable realtime on orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
