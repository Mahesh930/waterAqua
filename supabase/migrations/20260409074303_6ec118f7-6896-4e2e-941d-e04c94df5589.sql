
ALTER TABLE public.suppliers
ADD COLUMN price_per_tanker numeric NOT NULL DEFAULT 500;

ALTER TABLE public.suppliers
ADD COLUMN pincode text;

ALTER TABLE public.orders
ADD COLUMN pincode text;
