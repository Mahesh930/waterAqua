-- Add latitude and longitude to suppliers and profiles
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION;
