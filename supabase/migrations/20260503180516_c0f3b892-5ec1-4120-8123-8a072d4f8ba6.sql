CREATE POLICY "Customers can cancel their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = customer_id AND status IN ('placed', 'confirmed'))
WITH CHECK (auth.uid() = customer_id AND status = 'cancelled');