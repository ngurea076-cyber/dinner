import { motion } from "framer-motion";
import { MapPin } from "lucide-react";
import eventPoster from "@/assets/event-poster.jpg";

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
            className="rounded-xl overflow-hidden"
          >
            <img
              src={eventPoster}
              alt="Purple Nights Valentine's Edition Event Poster"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </motion.div>
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
