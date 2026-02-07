import { useEffect, useState, useRef } from "react";
import { motion } from "framer-motion";
import { Loader2, CheckCircle, XCircle } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

const PaymentPending = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state as {
    ticketId: string;
    checkoutId: string;
    fullName: string;
    quantity: number;
    total: number;
  } | null;

  const [status, setStatus] = useState<"pending" | "paid" | "failed">("pending");
  const [message, setMessage] = useState("");
  const pollCount = useRef(0);
  const maxPolls = 30; // 30 polls × 5s = 2.5 minutes

  useEffect(() => {
    if (!state?.ticketId) return;

    const interval = setInterval(async () => {
      pollCount.current++;

      try {
        const { data, error } = await supabase.functions.invoke("check-payment", {
          body: { ticketId: state.ticketId, checkoutId: state.checkoutId },
        });

        if (error) {
          console.error("Poll error:", error);
          return;
        }

        if (data?.status === "paid") {
          setStatus("paid");
          clearInterval(interval);
          // Redirect to success after a brief moment
          setTimeout(() => {
            navigate("/success", {
              state: {
                ticketId: data.ticketId,
                fullName: data.fullName,
                ticketType: data.ticketType,
                quantity: data.quantity,
                total: data.total,
              },
            });
          }, 2000);
        } else if (data?.status === "failed") {
          setStatus("failed");
          setMessage(data.message || "Payment was not completed");
          clearInterval(interval);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }

      if (pollCount.current >= maxPolls) {
        clearInterval(interval);
        setStatus("failed");
        setMessage("Payment verification timed out. If you completed payment, your ticket will be sent to your email shortly.");
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [state, navigate]);

  if (!state) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <div className="card-event text-center p-10">
          <p className="text-card-foreground mb-4">No payment information found.</p>
          <button onClick={() => navigate("/")} className="btn-primary">Go Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6 }}
        className="card-event purple-glow-border text-center max-w-md w-full p-8 sm:p-10"
      >
        {status === "pending" && (
          <>
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
            <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">
              Waiting for Payment
            </h1>
            <p className="text-muted-foreground/80 mb-4">
              An M-Pesa STK push has been sent to your phone. Please enter your PIN to complete the payment.
            </p>
            <div className="bg-secondary/50 rounded-xl p-4 text-sm text-card-foreground">
              <p className="font-medium">Name: <span className="text-primary">{state.fullName}</span></p>
              <p className="mt-1">Amount: <span className="font-bold text-primary">KES {state.total.toLocaleString()}</span></p>
            </div>
          </>
        )}

        {status === "paid" && (
          <>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200 }}
            >
              <CheckCircle className="w-16 h-16 text-primary mx-auto mb-6" />
            </motion.div>
            <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">
              Payment Received! 🎉
            </h1>
            <p className="text-muted-foreground/80">
              Redirecting to your ticket...
            </p>
          </>
        )}

        {status === "failed" && (
          <>
            <XCircle className="w-16 h-16 text-destructive mx-auto mb-6" />
            <h1 className="font-display text-2xl font-bold text-card-foreground mb-2">
              Payment Failed
            </h1>
            <p className="text-muted-foreground/80 mb-6">
              {message || "The payment could not be completed."}
            </p>
            <button onClick={() => navigate("/")} className="btn-primary">
              Try Again
            </button>
          </>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentPending;
