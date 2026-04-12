
-- Table for supplier service locations
CREATE TABLE public.supplier_service_areas (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  supplier_id UUID NOT NULL REFERENCES public.suppliers(id) ON DELETE CASCADE,
  pincode TEXT NOT NULL,
  area_name TEXT NOT NULL DEFAULT '',
  city TEXT NOT NULL DEFAULT '',
  state TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(supplier_id, pincode)
);

-- Enable RLS
ALTER TABLE public.supplier_service_areas ENABLE ROW LEVEL SECURITY;

-- Anyone can browse service areas (needed for product filtering)
CREATE POLICY "Anyone can view service areas"
ON public.supplier_service_areas
FOR SELECT
USING (true);

-- Suppliers can manage their own service areas
CREATE POLICY "Suppliers can insert service areas"
ON public.supplier_service_areas
FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

CREATE POLICY "Suppliers can update service areas"
ON public.supplier_service_areas
FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

CREATE POLICY "Suppliers can delete service areas"
ON public.supplier_service_areas
FOR DELETE
USING (
  EXISTS (SELECT 1 FROM public.suppliers WHERE id = supplier_id AND user_id = auth.uid())
);

-- Index for fast lookups
CREATE INDEX idx_service_areas_pincode ON public.supplier_service_areas(pincode);
CREATE INDEX idx_service_areas_supplier ON public.supplier_service_areas(supplier_id);
