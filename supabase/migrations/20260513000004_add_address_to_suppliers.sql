-- Add address column to suppliers
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
