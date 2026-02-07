import { motion } from "framer-motion";
import eventPoster from "@/assets/event-poster.jpg";

type PosterSectionProps = {
  compact?: boolean;
  noGlow?: boolean;
};

const PosterSection = ({ compact = false, noGlow = false }: PosterSectionProps) => {
  const posterSrc = `${import.meta.env.BASE_URL ?? "/"}dinner.png`;

  const card = (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.7 }}
      className={
        "card-event " + (noGlow ? "" : "purple-glow-border ") +
        "overflow-hidden" +
        (compact ? " bg-transparent p-0" : "")
      }
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ duration: 0.4 }}
        className="rounded-xl overflow-hidden"
      >
        <img
          src={posterSrc}
          alt="Womens Day Dinner Event Poster"
          className="w-full h-auto object-cover"
          loading="lazy"
          onError={(e) => {
            const img = e.currentTarget as HTMLImageElement;
            if (img.src !== eventPoster) img.src = eventPoster;
          }}
        />
      </motion.div>
    </motion.div>
  );

  if (compact) return card;

  return (
    <section className="py-20 px-4 relative">
      <div className="absolute inset-0 gradient-bg opacity-50 pointer-events-none" />
      <div className="container mx-auto max-w-4xl relative z-10">{card}</div>
    </section>
  );
};

export default PosterSection;
