import { motion } from "framer-motion";
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
      </div>
    </section>
  );
};

export default PosterSection;
