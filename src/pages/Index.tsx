import PosterSection from "@/components/PosterSection";
import TicketSection from "@/components/TicketSection";

const Index = () => {
  return (
    <main>
      <section className="py-20 px-4 relative">
        <div className="absolute inset-0 gradient-bg pointer-events-none" />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-foreground mb-2 purple-glow-text">
              Get Your Ticket
            </h2>
            <p className="text-muted-foreground">
              Secure your spot for the biggest night of the year
            </p>
          </div>

            <div className="bg-card rounded-2xl p-6 sm:p-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                <div>
                  <PosterSection compact noGlow />
                </div>
                <div>
                  <TicketSection compact showHeader={false} noGlow />
                </div>
              </div>
            </div>
        </div>
      </section>
    </main>
  );
};

export default Index;
