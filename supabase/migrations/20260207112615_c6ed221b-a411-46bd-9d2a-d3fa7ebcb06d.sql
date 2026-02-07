
-- Create orders table for ticket purchases
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  ticket_type TEXT NOT NULL DEFAULT 'single',
  quantity INTEGER NOT NULL DEFAULT 1,
  total_amount INTEGER NOT NULL,
  ticket_id TEXT NOT NULL,
  qr_code TEXT,
  checkout_id TEXT,
  transaction_id TEXT,
  payment_status TEXT NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Public insert policy (anyone can create an order to buy a ticket)
CREATE POLICY "Anyone can create orders"
ON public.orders
FOR INSERT
WITH CHECK (true);

-- Public select policy (users can view their order by ticket_id - will be filtered in app)
CREATE POLICY "Anyone can view orders by ticket_id"
ON public.orders
FOR SELECT
USING (true);

-- Only service role can update (for webhook callback)
-- No user-facing update policy needed; edge functions use service role key

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_orders_updated_at
BEFORE UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index on ticket_id for fast lookups
CREATE INDEX idx_orders_ticket_id ON public.orders (ticket_id);

-- Create index on checkout_id for webhook lookups
CREATE INDEX idx_orders_checkout_id ON public.orders (checkout_id);

-- Create index on payment_status for admin filtering
CREATE INDEX idx_orders_payment_status ON public.orders (payment_status);
