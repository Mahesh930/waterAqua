-- Create referrals table
CREATE TABLE public.referrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  referrer_id UUID NOT NULL,
  referred_id UUID NOT NULL,
  referral_code TEXT NOT NULL,
  reward_amount NUMERIC NOT NULL DEFAULT 50,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- Referrers can see their own referrals
CREATE POLICY "Referrers can view their referrals"
ON public.referrals
FOR SELECT
USING (auth.uid() = referrer_id);

-- Referred users can see their referral record
CREATE POLICY "Referred users can view their referral"
ON public.referrals
FOR SELECT
USING (auth.uid() = referred_id);

-- Authenticated users can create referrals
CREATE POLICY "Users can create referrals"
ON public.referrals
FOR INSERT
WITH CHECK (auth.uid() = referred_id);

-- Admins can update referral status
CREATE POLICY "Admins can update referrals"
ON public.referrals
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add referral_code column to profiles for storing user's own code
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_credits NUMERIC DEFAULT 0;

-- Create index for fast lookups
CREATE INDEX idx_referrals_referrer ON public.referrals (referrer_id);
CREATE INDEX idx_referrals_code ON public.referrals (referral_code);
CREATE INDEX idx_profiles_referral_code ON public.profiles (referral_code);

-- Function to auto-generate referral code on profile creation
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.referral_code IS NULL THEN
    NEW.referral_code := upper(substring(NEW.user_id::text from 1 for 4) || substring(md5(random()::text) from 1 for 4));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER set_referral_code
BEFORE INSERT ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.generate_referral_code();

-- Function to credit referrer when referral is completed
CREATE OR REPLACE FUNCTION public.credit_referral()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'credited' AND OLD.status = 'pending' THEN
    UPDATE public.profiles
    SET referral_credits = COALESCE(referral_credits, 0) + NEW.reward_amount
    WHERE user_id = NEW.referrer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER credit_referral_on_status_change
AFTER UPDATE ON public.referrals
FOR EACH ROW
EXECUTE FUNCTION public.credit_referral();

-- Auto-credit referral after referred user's first delivered order
CREATE OR REPLACE FUNCTION public.auto_credit_referral_on_delivery()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    UPDATE public.referrals
    SET status = 'credited'
    WHERE referred_id = NEW.customer_id AND status = 'pending';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER auto_credit_referral
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.auto_credit_referral_on_delivery();