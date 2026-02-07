-- Add scanned flag and scanned_at timestamp to orders
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS scanned boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scanned_at timestamp with time zone;
