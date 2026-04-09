-- Create admin commissions table
CREATE TABLE public.admin_commissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  supplier_id UUID NOT NULL,
  customer_id UUID NOT NULL,
  order_amount NUMERIC NOT NULL,
  commission_rate NUMERIC NOT NULL DEFAULT 0.10,
  commission_amount NUMERIC NOT NULL,
  area TEXT NOT NULL DEFAULT '',
  pincode TEXT,
  order_hour INTEGER NOT NULL DEFAULT 0,
  is_peak_hour BOOLEAN NOT NULL DEFAULT false,
  formula_breakdown TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_commissions ENABLE ROW LEVEL SECURITY;

-- Only admins can view commissions
CREATE POLICY "Admins can view all commissions"
ON public.admin_commissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_commissions_order ON public.admin_commissions (order_id);
CREATE INDEX idx_commissions_supplier ON public.admin_commissions (supplier_id);
CREATE INDEX idx_commissions_created ON public.admin_commissions (created_at DESC);

-- Commission calculation function
-- Formula: base_rate (10%) + area_bonus (metro=+2%, rural=-2%) + peak_hour_bonus (+2%)
CREATE OR REPLACE FUNCTION public.calculate_admin_commission()
RETURNS TRIGGER AS $$
DECLARE
  supplier_area TEXT;
  supplier_pincode TEXT;
  base_rate NUMERIC := 0.10;
  area_bonus NUMERIC := 0;
  peak_bonus NUMERIC := 0;
  final_rate NUMERIC;
  commission NUMERIC;
  order_hr INTEGER;
  is_peak BOOLEAN;
  breakdown TEXT;
BEGIN
  -- Only trigger on delivered status
  IF NEW.status != 'delivered' OR OLD.status = 'delivered' THEN
    RETURN NEW;
  END IF;

  -- Get supplier info
  SELECT area, pincode INTO supplier_area, supplier_pincode
  FROM public.suppliers WHERE id = NEW.supplier_id;

  -- Get order hour (IST = UTC + 5:30)
  order_hr := EXTRACT(HOUR FROM (NEW.created_at AT TIME ZONE 'Asia/Kolkata'));

  -- Peak hour check (6-10 AM or 5-9 PM)
  is_peak := (order_hr BETWEEN 6 AND 10) OR (order_hr BETWEEN 17 AND 21);
  IF is_peak THEN
    peak_bonus := 0.02;
  END IF;

  -- Area-based rate: metro cities get +2%, others standard
  -- Using pincode prefix: 1xxxxx (Delhi), 4xxxxx (Mumbai), 5xxxxx (Hyderabad/Bangalore), 6xxxxx (Chennai/Kerala)
  IF supplier_pincode IS NOT NULL AND LENGTH(supplier_pincode) = 6 THEN
    CASE LEFT(supplier_pincode, 1)
      WHEN '1' THEN area_bonus := 0.02; -- Delhi NCR
      WHEN '4' THEN area_bonus := 0.02; -- Mumbai/Maharashtra
      WHEN '5' THEN area_bonus := 0.02; -- Hyderabad/Bangalore
      WHEN '6' THEN area_bonus := 0.01; -- Chennai/Kerala
      ELSE area_bonus := 0;             -- Other areas
    END CASE;
  END IF;

  final_rate := base_rate + area_bonus + peak_bonus;
  commission := ROUND(NEW.total_amount * final_rate, 2);

  breakdown := 'Base: ' || (base_rate * 100)::TEXT || '% + Area: ' || (area_bonus * 100)::TEXT || '% + Peak: ' || (peak_bonus * 100)::TEXT || '% = ' || (final_rate * 100)::TEXT || '%';

  -- Insert commission record
  INSERT INTO public.admin_commissions (
    order_id, supplier_id, customer_id, order_amount,
    commission_rate, commission_amount, area, pincode,
    order_hour, is_peak_hour, formula_breakdown
  ) VALUES (
    NEW.id, NEW.supplier_id, NEW.customer_id, NEW.total_amount,
    final_rate, commission, COALESCE(supplier_area, ''), supplier_pincode,
    order_hr, is_peak, breakdown
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger on order status update to delivered
CREATE TRIGGER calculate_commission_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.calculate_admin_commission();