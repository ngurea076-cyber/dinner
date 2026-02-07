import { motion } from "framer-motion";
import { Music, Shirt, MapPin, Phone, Smartphone } from "lucide-react";
import eventPoster from "@/assets/event-poster.jpg";

const eventDetails = [
  { icon: Music, label: "Music Policy", value: "Afrobeats · Amapiano · RnB · Gengetone" },
  { icon: Shirt, label: "Dress Code", value: "Smart Casual / All White Allowed" },
  { icon: MapPin, label: "Venue", value: "The Grand Rooftop Lounge, Westlands, Nairobi" },
  { icon: Phone, label: "Reservations", value: "+254 712 345 678" },
  { icon: Smartphone, label: "Lipa na M-Pesa", value: "Paybill: 247247 | Acc: PurpleNights" },
];

const PosterSection = () => {
  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 gradient-bg opacity-50 pointer-events-none" />
      
      <div className="container mx-auto max-w-4xl relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="card-event purple-glow-border overflow-hidden"
        >
          {/* Poster Image */}
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.4 }}
            className="rounded-xl overflow-hidden mb-8"
          >
            <img
              src={eventPoster}
              alt="Purple Nights Valentine's Edition Event Poster"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </motion.div>

          {/* Event Details */}
          <div className="space-y-5">
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-card-foreground text-center mb-6">
              Event Details
            </h2>
            {eventDetails.map((detail, index) => (
              <motion.div
                key={detail.label}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="flex items-start gap-4 p-4 rounded-xl bg-secondary/50"
              >
                <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <detail.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground/70">{detail.label}</p>
                  <p className="font-semibold text-card-foreground">{detail.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Directions Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center mt-8"
        >
          <a
            href="https://maps.google.com/?q=The+Grand+Rooftop+Lounge+Westlands+Nairobi"
            target="_blank"
            rel="noopener noreferrer"
          >
            <motion.button
              className="btn-primary inline-flex items-center gap-2"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
            >
              <MapPin className="w-5 h-5" />
              Get Directions
            </motion.button>
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default PosterSection;
