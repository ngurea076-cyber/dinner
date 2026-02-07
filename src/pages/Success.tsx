import { motion } from "framer-motion";
import { CheckCircle, Home, Mail } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const SuccessPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    ticketId: string;
    fullName: string;
    ticketType: string;
    quantity: number;
    total: number;
  } | null;

  if (!state) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="card-event text-center p-10">
          <p className="text-card-foreground mb-4">No ticket information found.</p>
          <button onClick={() => navigate("/")} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card-event purple-glow-border text-center max-w-md w-full p-8 sm:p-10"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
        >
          <CheckCircle className="w-20 h-20 text-primary mx-auto mb-6" />
        </motion.div>

        <h1 className="font-display text-3xl font-bold text-card-foreground mb-2">
          Payment Successful 🎉
        </h1>
        <p className="text-muted-foreground/80 mb-3">
          Your ticket has been confirmed!
        </p>
        <div className="flex items-center justify-center gap-2 text-primary mb-8 bg-primary/10 rounded-lg py-3 px-4">
          <Mail className="w-4 h-4" />
          <p className="text-sm font-medium">
            Your ticket has been sent to your email
          </p>
        </div>

        <div className="space-y-3 text-left bg-secondary/50 rounded-xl p-5 mb-8">
          <div className="flex justify-between">
            <span className="text-muted-foreground/70 text-sm">Name</span>
            <span className="text-card-foreground font-medium">{state.fullName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground/70 text-sm">Type</span>
            <span className="text-card-foreground font-medium capitalize">{state.ticketType}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground/70 text-sm">Quantity</span>
            <span className="text-card-foreground font-medium">{state.quantity}</span>
          </div>
          <div className="flex justify-between border-t border-border pt-3">
            <span className="text-card-foreground font-medium">Total Paid</span>
            <span className="text-lg font-bold text-primary">
              KES {state.total.toLocaleString()}
            </span>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/")}
          className="w-full px-6 py-4 rounded-xl border border-primary text-primary font-semibold
                     hover:bg-primary/5 transition-colors flex items-center justify-center gap-2"
        >
          <Home className="w-4 h-4" />
          Back to Home
        </motion.button>
      </motion.div>
    </div>
  );
};

export default SuccessPage;
