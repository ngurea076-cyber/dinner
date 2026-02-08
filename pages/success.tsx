import { motion } from "framer-motion";
import { CheckCircle, Home, Mail, QrCode } from "lucide-react";
import { useRouter } from "next/router";
import { SetStateAction, useEffect, useState } from "react";
import qrcode from "qrcode";
import Navbar from "../components/Navbar";

interface OrderData {
  ticket_id: string;
  full_name: string;
  email: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  qr_code: string;
}

const SuccessPage = () => {
  const router = useRouter();
  const { ticketId } = router.query;
  const [orderData, setOrderData] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrCodeUrl, setQrCodeUrl] = useState<string>("");

  useEffect(() => {
    if (!ticketId) return;

    const fetchOrderData = async () => {
      try {
        const response = await fetch(`/api/orders?ticketId=${ticketId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch order data');
        }

        setOrderData(data.order);
      } catch (err: unknown) {
        console.error('Error fetching order:', err);
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, [ticketId]);

  // Generate QR code when order data is loaded
  useEffect(() => {
    if (orderData?.qr_code) {
      qrcode.toDataURL(orderData.qr_code, { width: 200, margin: 1 }, (err: unknown, url: SetStateAction<string>) => {
        if (!err) {
          setQrCodeUrl(url);
        }
      });
    }
  }, [orderData]);

  if (!ticketId) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <Navbar />
        <div className="card-event text-center p-10">
          <p className="text-card-foreground mb-4">No ticket information found.</p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <Navbar />
        <div className="card-event text-center p-10">
          <p className="text-card-foreground mb-4">Loading ticket details...</p>
        </div>
      </div>
    );
  }

  if (error || !orderData) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <Navbar />
        <div className="card-event text-center p-10">
          <p className="text-card-foreground mb-4">
            {error || 'Ticket not found.'}
          </p>
          <button onClick={() => router.push("/")} className="btn-primary">
            Go Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center px-4 py-12">
      <Navbar />
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="card-event purple-glow-border text-center max-w-md md:max-w-3xl w-full p-8 sm:p-10"
      >

        <div className="flex flex-col md:flex-row">
          <div>
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
                <span className="text-card-foreground font-medium">{orderData.full_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground/70 text-sm">Type</span>
                <span className="text-card-foreground font-medium capitalize">{orderData.ticket_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground/70 text-sm">Quantity</span>
                <span className="text-card-foreground font-medium">{orderData.quantity}</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-card-foreground font-medium">Total Paid</span>
                <span className="text-lg font-bold text-primary">
                  KES {orderData.total_amount.toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex justify-center flex-1">
            <div className="bg-secondary/50 rounded-xl p-5 mb-8">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-card-foreground">Your Ticket QR Code</h3>
              </div>
              <div className="flex justify-center">
                <div className="bg-white p-4 rounded-lg">
                  {qrCodeUrl ? (
                    <img src={qrCodeUrl} alt="Ticket QR Code" className="w-48 h-48" />
                  ) : (
                    <p className="text-sm text-muted-foreground">Generating QR code...</p>
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground/70 text-center mt-3">
                Ticket ID: {orderData.ticket_id}
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => router.push("/")}
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
