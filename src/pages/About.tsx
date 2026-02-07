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
            About Womens Day Dinner
          </h1>
          <div className="space-y-4 text-muted-foreground/80 leading-relaxed">
            <p>
              The International Women's Day Dinner hosted by Bidii Girls Programme is an exclusive, high-level gathering bringing together senior women leaders from Kenya's political and corporate spaces, alongside professionals and change-makers committed to advancing women's empowerment.
            </p>

            <p>
              Guided by the theme "Give to Gain," the evening will feature inspiring guest speakers and meaningful engagements exploring how leadership, mentorship, and intentional giving create lasting personal and societal impact.
            </p>

            <p>
              Guests can expect an elegant experience, purposeful conversations, and rare opportunities to connect with influential women shaping policy, business, and community development.
            </p>

            <p>
              This is more than a dinner — it is a celebration of women, leadership, and collective progress.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default AboutPage;
