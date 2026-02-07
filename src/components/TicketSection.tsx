import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";

const ticketSchema = z.object({
  fullName: z.string().trim().min(2, "Name must be at least 2 characters").max(100),
  email: z.string().trim().email("Invalid email address").max(255),
  phone: z.string().regex(/^2547\d{8}$/, "Phone format: 2547XXXXXXXX"),
  ticketType: z.enum(["single", "couple", "vip"]),
  quantity: z.number().min(1, "Minimum 1 ticket").max(10, "Maximum 10 tickets"),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const PRICES: Record<string, number> = {
  single: 1500,
  couple: 2500,
  vip: 5000,
};

const TICKET_LABELS: Record<string, string> = {
  single: "Single — KES 1,500",
  couple: "Couple — KES 2,500",
  vip: "VIP — KES 5,000",
};

const TicketSection = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState<TicketFormData>({
    fullName: "",
    email: "",
    phone: "",
    ticketType: "single",
    quantity: 1,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  const total = useMemo(
    () => PRICES[form.ticketType] * form.quantity,
    [form.ticketType, form.quantity]
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: name === "quantity" ? Math.max(1, Math.min(10, parseInt(value) || 1)) : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
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

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    const ticketId = crypto.randomUUID().split("-")[0].toUpperCase();
    navigate("/success", {
      state: {
        ticketId,
        fullName: form.fullName,
        ticketType: form.ticketType,
        quantity: form.quantity,
        total,
      },
    });
  };

  return (
    <section id="tickets" className="py-20 px-4 relative">
      <div className="absolute inset-0 gradient-bg pointer-events-none" />

      <div className="container mx-auto max-w-lg relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground text-center mb-2 purple-glow-text">
            Get Your Ticket
          </h2>
          <p className="text-muted-foreground text-center mb-10">
            Secure your spot for the biggest night of the year
          </p>

          <form onSubmit={handleSubmit} className="card-event purple-glow-border space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Full Name</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={handleChange}
                placeholder="John Doe"
                className="input-field"
                required
              />
              {errors.fullName && <p className="text-destructive text-sm mt-1">{errors.fullName}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Email</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="input-field"
                required
              />
              {errors.email && <p className="text-destructive text-sm mt-1">{errors.email}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Phone Number</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="2547XXXXXXXX"
                className="input-field"
                required
              />
              {errors.phone && <p className="text-destructive text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Ticket Type */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Ticket Type</label>
              <select
                name="ticketType"
                value={form.ticketType}
                onChange={handleChange}
                className="input-field"
              >
                {Object.entries(TICKET_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1.5">Quantity</label>
              <input
                name="quantity"
                type="number"
                min={1}
                max={10}
                value={form.quantity}
                onChange={handleChange}
                className="input-field"
              />
              {errors.quantity && <p className="text-destructive text-sm mt-1">{errors.quantity}</p>}
            </div>

            {/* Total */}
            <div className="pt-4 border-t border-border">
              <div className="flex justify-between items-center">
                <span className="text-card-foreground font-medium">Total</span>
                <span className="text-2xl font-bold text-primary">
                  KES {total.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Submit */}
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
                  Processing...
                </>
              ) : (
                "🟣 Pay with M-Pesa"
              )}
            </motion.button>
          </form>
        </motion.div>
      </div>
    </section>
  );
};

export default TicketSection;
