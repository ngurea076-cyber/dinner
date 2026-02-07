import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const ticketSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z
    .string()
    .regex(/^254[17]\d{8}$/, "Phone format: 2547XXXXXXXX or 2541XXXXXXXX"),
  quantity: z.number().min(1, "Minimum 1 ticket").max(10, "Maximum 10 tickets"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const TICKET_PRICE = 1;

type TicketSectionProps = {
  compact?: boolean;
  showHeader?: boolean;
  noGlow?: boolean;
};

const TicketSection = ({
  compact = false,
  showHeader = true,
  noGlow = false,
}: TicketSectionProps) => {
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketFormData>({
    fullName: "",
    email: "",
    phone: "",
    quantity: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");

  const total = useMemo(() => TICKET_PRICE * form.quantity, [form.quantity]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "quantity"
          ? Math.max(1, Math.min(10, parseInt(value) || 1))
          : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
    setApiError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = ticketSchema.safeParse(form);

    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    setApiError("");

    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          quantity: form.quantity,
        },
      });

      if (error) throw new Error(error.message);
      if (!data?.success)
        throw new Error(data?.error || "Failed to create order");

      // Navigate to waiting page with payment details
      navigate("/payment-pending", {
        state: {
          ticketId: data.ticketId,
          checkoutId: data.checkoutId,
          fullName: form.fullName,
          quantity: form.quantity,
          total,
        },
      });
    } catch (err: any) {
      console.error("Payment error:", err);
      setApiError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const content = (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.7 }}
    >
      {showHeader && (
        <>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-2 purple-glow-text">
            Get Your Ticket
          </h2>
          <p className="text-muted-foreground text-center mb-2">
            Secure your spot for the biggest night of the year
          </p>
        </>
      )}

      <form
        onSubmit={handleSubmit}
        className={
          "card-event " + (noGlow ? "" : "purple-glow-border ") + "space-y-5"
        }
      >
        {apiError && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            {apiError}
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">
            Full Name
          </label>
          <input
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="John Doe"
            className="input-field"
            required
          />
          {errors.fullName && (
            <p className="text-destructive text-sm mt-1">{errors.fullName}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">
            Email
          </label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="john@example.com"
            className="input-field"
            required
          />
          {errors.email && (
            <p className="text-destructive text-sm mt-1">{errors.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">
            Phone Number
          </label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="2547XXXXXXXX or 2541XXXXXXXX"
            className="input-field"
            required
          />
          {errors.phone && (
            <p className="text-destructive text-sm mt-1">{errors.phone}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-card-foreground mb-1.5">
            Quantity
          </label>
          <input
            name="quantity"
            type="number"
            min={1}
            max={10}
            value={form.quantity}
            onChange={handleChange}
            className="input-field"
          />
          {errors.quantity && (
            <p className="text-destructive text-sm mt-1">{errors.quantity}</p>
          )}
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex justify-between items-center">
            <span className="text-card-foreground font-medium">Total</span>
            <span className="text-2xl font-bold text-primary">
              KES {total.toLocaleString()}
            </span>
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading}
          className="btn-primary w-full flex items-center justify-center gap-2 text-lg disabled:opacity-60"
          whileHover={{ scale: loading ? 1 : 1.02 }}
          whileTap={{ scale: loading ? 1 : 0.98 }}
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Initiating Payment...
            </>
          ) : (
            "Pay with M-Pesa"
          )}
        </motion.button>
      </form>
    </motion.div>
  );

  if (compact) return content;

  return (
    <section id="tickets" className="py-20 px-4 relative">
      <div className="absolute inset-0 gradient-bg pointer-events-none" />

      <div className="container mx-auto max-w-lg relative z-10">{content}</div>
    </section>
  );
};

export default TicketSection;
