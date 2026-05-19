-- Add email column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- Update profiles with emails from auth.users (if possible, though this usually requires a trigger or manual sync)
-- For now, we'll just add the column.
