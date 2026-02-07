import { motion } from "framer-motion";

const HeroSection = () => {
  const scrollToTickets = () => {
    document.getElementById("tickets")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center gradient-bg-hero overflow-hidden">
      {/* Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-primary/20 blur-[120px] animate-glow-pulse pointer-events-none" />
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent pointer-events-none" />

      <div className="container mx-auto px-4 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="floating-pill mb-8 animate-float"
          >
            ✨ Womens Day Dinner
          </motion.div>

          <h1 className="font-display text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-black uppercase tracking-tight text-foreground purple-glow-text leading-none mb-6">
            Womens
            <br />
            Day Dinner
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="flex items-center justify-center gap-4 mb-10"
          >
            <span className="floating-pill">📅 Mar 7, 2026</span>
            <span className="floating-pill">🕘 8:00 PM</span>
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            onClick={scrollToTickets}
            className="btn-primary text-lg"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
          >
            🎟 Buy Ticket
          </motion.button>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
