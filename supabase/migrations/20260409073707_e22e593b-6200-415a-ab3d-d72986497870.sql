
ALTER TABLE public.suppliers
ADD COLUMN tanker_capacity integer NOT NULL DEFAULT 5000,
ADD COLUMN driver_phone text,
ADD COLUMN vehicle_number text;
