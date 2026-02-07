import { motion } from "framer-motion";

const AboutPage = () => {
  return (
    <div className="min-h-screen gradient-bg pt-24 px-4 pb-20">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="card-event purple-glow-border p-8 sm:p-12"
        >
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-card-foreground mb-6">
            About Purple Nights
          </h1>
          <div className="space-y-4 text-muted-foreground/80 leading-relaxed">
            <p>
              Purple Nights is a premium event experience brought to you by{" "}
              <a
                href="https://bidiigirlsprogramme.org"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary font-medium hover:underline"
              >
                Bidii Girls Programme
              </a>
              . We curate unforgettable evenings that bring together music, culture, and community.
            </p>
            <p>
              Our Valentine's Edition is the highlight of the year — a night filled with Afrobeats, Amapiano,
              RnB, and Gengetone, all set in the stunning Grand Rooftop Lounge in Westlands, Nairobi.
            </p>
            <p>
              Whether you're coming solo, as a couple, or VIP, we promise a world-class experience
              with top DJs, premium drinks, and an atmosphere that's truly electric.
            </p>
            <h2 className="font-display text-xl font-bold text-card-foreground pt-4">Our Mission</h2>
            <p>
              Beyond the music, Purple Nights supports the Bidii Girls Programme — empowering
              young women through education, mentorship, and community development. Every ticket
              purchased contributes to creating lasting change.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
