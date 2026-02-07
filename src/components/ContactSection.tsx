import { motion } from "framer-motion";
import { Phone, Mail, MessageCircle } from "lucide-react";

const contacts = [
  {
    icon: Phone,
    label: "Call Us",
    value: "+254 712 345 678",
    href: "tel:+254712345678",
  },
  {
    icon: Mail,
    label: "Email",
    value: "info@womensdaydinner.co.ke",
    href: "mailto:info@womensdaydinner.co.ke",
  },
  {
    icon: MessageCircle,
    label: "WhatsApp",
    value: "+254 739 804 285",
    href: "https://wa.me/254739804285?text=Hi!%20I%27m%20interested%20in%20Womens%20Day%20Dinner",
  },
];

const ContactSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto max-w-2xl text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 purple-glow-text">
            Get In Touch
          </h2>
          <p className="text-muted-foreground mb-10">
            Questions? We'd love to hear from you.
          </p>
        </motion.div>

        <div className="grid gap-4 sm:grid-cols-3">
          {contacts.map((contact, i) => (
            <motion.a
              key={contact.label}
              href={contact.href}
              target={contact.label === "WhatsApp" ? "_blank" : undefined}
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="card-event purple-glow-border flex flex-col items-center gap-3 p-6 cursor-pointer no-underline"
            >
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <contact.icon className="w-6 h-6 text-primary" />
              </div>
              <p className="font-semibold text-card-foreground">{contact.label}</p>
              <p className="text-sm text-muted-foreground/80">{contact.value}</p>
            </motion.a>
          ))}
        </div>

        {/* Social Icons */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4, duration: 0.5 }}
          className="mt-10 flex justify-center gap-6"
        >
          {["Instagram", "TikTok", "Twitter"].map((social) => (
            <a
              key={social}
              href="#"
              className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
            >
              {social}
            </a>
          ))}
        </motion.div>

        <p className="text-muted-foreground/50 text-sm mt-12">
          © 2026 Womens Day Dinner. All rights reserved.
        </p>
      </div>
    </section>
  );
};

export default ContactSection;
