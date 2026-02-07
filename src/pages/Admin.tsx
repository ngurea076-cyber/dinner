import React, { useState, useMemo, useEffect, lazy, Suspense } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Clock,
  ShoppingCart,
  Search,
  Download,
  RefreshCw,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Send,
  Loader2,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
const QRScanner = lazy(() => import("@/components/QRScanner"));

interface Order {
  id: string;
  ticket_id: string;
  full_name: string;
  email: string;
  phone: string;
  ticket_type: string;
  quantity: number;
  total_amount: number;
  payment_status: string;
  created_at: string;
  qr_code?: string | null;
  scanned?: boolean;
  scanned_at?: string | null;
}

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [resendingId, setResendingId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [manualQr, setManualQr] = useState("");
  const [scannedTicket, setScannedTicket] = useState<any | null>(null);
  const perPage = 10;

  useEffect(() => {
    if (isLoggedIn) {
      fetchOrders();
    }
  }, [isLoggedIn]);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setOrders(data as Order[]);
    }
    setLoadingOrders(false);
  };
  // Scan/mark using ticket ID value instead of QR
  const handleScanByTicketId = async (ticketId: string) => {
    try {
      const check = await supabase.functions.invoke("verify-qr", {
        body: { ticketId },
      });
      if (check.error) throw new Error(check.error.message || check.error);
      const info = check.data;

      if (!info?.success) {
        toast({
          title: "Invalid ticket",
          description: info?.error || "Ticket not found",
          variant: "destructive",
        });
        return;
      }

      if (info.ticket) setScannedTicket(info.ticket);

      if (info.status === "already_scanned") {
        toast({
          title: "Ticket already scanned",
          description: `Scanned at: ${info.scannedAt || "unknown"}`,
          variant: "destructive",
        });
        fetchOrders();
        return;
      }

      if (info.status === "not_scanned") {
        const mark = await supabase.functions.invoke("verify-qr", {
          body: { ticketId, mark: true },
        });
        if (mark.error) throw new Error(mark.error.message || mark.error);
        const m = mark.data;
        if (!m?.success) {
          toast({
            title: "Mark failed",
            description: m?.error || "Unable to mark ticket",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Verified", description: "Ticket marked as scanned" });
        if (m.ticket) setScannedTicket(m.ticket);
        fetchOrders();
        return;
      }

      toast({ title: "Info", description: `Verification: ${info.status}` });
      fetchOrders();
    } catch (err: any) {
      toast({
        title: "Scan error",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleVerify = async (qr: string) => {
    try {
      const res = await supabase.functions.invoke("verify-qr", {
        body: { qr },
      });
      if (res.error) throw new Error(res.error.message || res.error);
      const data = res.data;
      if (!data?.success) {
        toast({
          title: "Verification failed",
          description: data?.error || "Unknown",
          variant: "destructive",
        });
      } else {
        if (data.status === "already_scanned") {
          toast({
            title: "Already scanned",
            description: `Scanned at: ${data.scannedAt || "unknown"}`,
            variant: "destructive",
          });
        } else {
          toast({ title: "Scanned", description: "Ticket marked as scanned" });
        }
        fetchOrders();
        setScannerOpen(false);
      }
    } catch (err: any) {
      toast({
        title: "Verify error",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  // Perform a camera scan verification and mark as used
  const handleScan = async (qr: string) => {
    try {
      // First, ask the edge function for the ticket status without marking
      const check = await supabase.functions.invoke("verify-qr", {
        body: { qr },
      });
      if (check.error) throw new Error(check.error.message || check.error);
      const info = check.data;

      if (!info?.success) {
        // Ticket not found or other error - notify and return
        toast({
          title: "Invalid ticket",
          description: info?.error || "Ticket not found",
          variant: "destructive",
        });
        return;
      }

      // show ticket info in modal
      if (info.ticket) setScannedTicket(info.ticket);

      if (info.status === "already_scanned") {
        toast({
          title: "Ticket already scanned",
          description: `Scanned at: ${info.scannedAt || "unknown"}`,
          variant: "destructive",
        });
        fetchOrders();
        return;
      }

      if (info.status === "not_scanned") {
        // Now mark it as scanned
        const mark = await supabase.functions.invoke("verify-qr", {
          body: { qr, mark: true },
        });
        if (mark.error) throw new Error(mark.error.message || mark.error);
        const m = mark.data;
        if (!m?.success) {
          toast({
            title: "Mark failed",
            description: m?.error || "Unable to mark ticket",
            variant: "destructive",
          });
          return;
        }
        toast({ title: "Verified", description: "Ticket marked as scanned" });
        if (m.ticket) setScannedTicket(m.ticket);
        fetchOrders();
        return;
      }

      toast({ title: "Info", description: `Verification: ${info.status}` });
      fetchOrders();
    } catch (err: any) {
      toast({
        title: "Scan error",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };
  const handleLookup = async (qr: string) => {
    try {
      const res = await supabase.functions.invoke("lookup-qr", {
        body: { qr },
      });
      if (res.error) throw new Error(res.error.message || res.error);
      const data = res.data;
      if (!data?.success) {
        toast({
          title: "Lookup failed",
          description: data?.error || "Unknown",
          variant: "destructive",
        });
        return;
      }
      setScannedTicket(data.ticket);
    } catch (err: any) {
      toast({
        title: "Lookup error",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const handleMarkUsed = async (qr: string) => {
    try {
      const res = await supabase.functions.invoke("verify-qr", {
        body: { qr, mark: true },
      });
      if (res.error) throw new Error(res.error.message || res.error);
      const data = res.data;
      if (!data?.success) {
        toast({
          title: "Mark failed",
          description: data?.error || "Unknown",
          variant: "destructive",
        });
        return;
      }
      toast({ title: "Verified", description: "Ticket marked as used" });
      setScannedTicket(null);
      setScannerOpen(false);
      fetchOrders();
    } catch (err: any) {
      toast({
        title: "Mark error",
        description: err.message || String(err),
        variant: "destructive",
      });
    }
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      const matchesSearch =
        !search ||
        o.full_name.toLowerCase().includes(search.toLowerCase()) ||
        o.ticket_id.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        statusFilter === "all" || o.payment_status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(
    () => ({
      revenue: orders
        .filter((o) => o.payment_status === "paid")
        .reduce((s, o) => s + o.total_amount, 0),
      sold: orders
        .filter((o) => o.payment_status === "paid")
        .reduce((s, o) => s + o.quantity, 0),
      pending: orders.filter((o) => o.payment_status === "pending").length,
      total: orders.length,
    }),
    [orders],
  );

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) setIsLoggedIn(true);
  };

  const exportCSV = () => {
    const header = "Ticket ID,Name,Email,Phone,Type,Qty,Amount,Status,Date\n";
    const rows = filtered
      .map(
        (o) =>
          `${o.ticket_id},${o.full_name},${o.email},${o.phone},${o.ticket_type},${o.quantity},${o.total_amount},${o.payment_status},${o.created_at}`,
      )
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResendTicket = async (orderId: string) => {
    setResendingId(orderId);
    try {
      const { data, error } = await supabase.functions.invoke("resend-ticket", {
        body: { orderId },
      });
      if (error) throw new Error(error.message);
      if (!data?.success) throw new Error(data?.error || "Failed to resend");
      toast({
        title: "Sent",
        description: data.message || "Ticket sent successfully!",
      });
    } catch (err: any) {
      toast({
        title: "Resend failed",
        description: err.message || "Unknown error",
        variant: "destructive",
      });
    } finally {
      setResendingId(null);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen gradient-bg flex items-center justify-center px-4">
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleLogin}
          className="card-event purple-glow-border w-full max-w-sm p-8 space-y-5"
        >
          <h2 className="font-display text-2xl font-bold text-card-foreground text-center">
            Admin Login
          </h2>
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) =>
              setLoginForm((p) => ({ ...p, email: e.target.value }))
            }
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm((p) => ({ ...p, password: e.target.value }))
            }
            className="input-field"
            required
          />
          <button type="submit" className="btn-primary w-full">
            Sign In
          </button>
        </motion.form>
      </div>
    );
  }

  const statCards = [
    {
      label: "Total Revenue",
      value: `KES ${stats.revenue.toLocaleString()}`,
      icon: DollarSign,
    },
    { label: "Tickets Sold", value: stats.sold, icon: Ticket },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "Total Orders", value: stats.total, icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-display text-xl font-bold text-primary">
          Womens Day Dinner Admin
        </h1>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/")}
            className="text-sm text-muted-foreground hover:text-card-foreground transition-colors"
          >
            View Site
          </button>
          <button
            onClick={() => setIsLoggedIn(false)}
            className="text-sm text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1"
          >
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="admin-card flex items-center gap-4"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <s.icon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground/70">{s.label}</p>
                <p className="text-xl font-bold text-card-foreground">
                  {s.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="admin-card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search orders..."
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="input-field sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <button
              onClick={exportCSV}
              className="btn-primary no-glow flex items-center gap-2 text-sm py-3"
            >
              <Download className="w-4 h-4" /> Export CSV
            </button>
            {/* <button onClick={() => setScannerOpen(true)} className="btn-primary no-glow flex items-center gap-2 text-sm py-3">
              Scan QR
            </button> */}
            <button
              onClick={() => setScannerOpen(true)}
              className="btn-primary no-glow flex items-center gap-2 text-sm py-3"
            >
              Verify Ticket ID
            </button>
            <button
              onClick={fetchOrders}
              className="btn-primary no-glow flex items-center gap-2 text-sm py-3"
              aria-label="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        <div className="admin-card overflow-x-auto">
          {loadingOrders ? (
            <div className="text-center py-10 text-muted-foreground">
              Loading orders...
            </div>
          ) : (
            <table className="w-full min-w-[700px] text-sm">
              <thead>
                <tr className="border-b border-border">
                  {[
                    "Ticket ID",
                    "Name",
                    "Email",
                    "Phone",
                    "Qty",
                    "Amount",
                    "Status",
                    "Date",
                    "Actions",
                  ].map((h) => (
                    <th
                      key={h}
                      className="text-left py-3 px-3 font-semibold text-muted-foreground/70 text-xs uppercase tracking-wider"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="py-10 text-center text-muted-foreground"
                    >
                      No orders found
                    </td>
                  </tr>
                ) : (
                  paginated.map((o) => (
                    <tr
                      key={o.id}
                      className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                    >
                      <td className="py-3 px-3 font-mono font-medium text-primary text-xs">
                        {o.ticket_id}
                      </td>
                      <td className="py-3 px-3 text-card-foreground">
                        {o.full_name}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground/80">
                        {o.email}
                      </td>
                      <td className="py-3 px-3 text-muted-foreground/80">
                        {o.phone}
                      </td>
                      <td className="py-3 px-3 text-card-foreground">
                        {o.quantity}
                      </td>
                      <td className="py-3 px-3 font-medium text-card-foreground">
                        KES {o.total_amount.toLocaleString()}
                      </td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.payment_status] || ""}`}
                        >
                          {o.payment_status}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground/80 text-xs">
                        {new Date(o.created_at).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex gap-2 items-center">
                          {o.payment_status === "paid" && (
                            <button
                              onClick={() => handleResendTicket(o.id)}
                              disabled={resendingId === o.id}
                              className="text-xs text-primary hover:text-primary/80 font-medium flex items-center gap-1 disabled:opacity-50"
                            >
                              {resendingId === o.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Resend
                            </button>
                          )}

                          {/* Scan moved to global header button */}
                        </div>
                        <div className="mt-2">
                          {o.scanned ? (
                            <span className="text-xs text-green-600">
                              Scanned
                            </span>
                          ) : (
                            <span className="text-xs text-muted-foreground/80">
                              Not scanned
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          )}

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-sm text-muted-foreground/70">
                Showing {(page - 1) * perPage + 1}–
                {Math.min(page * perPage, filtered.length)} of {filtered.length}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="p-2 rounded-lg hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronLeft className="w-4 h-4 text-card-foreground" />
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="p-2 rounded-lg hover:bg-secondary/50 disabled:opacity-30 transition-colors"
                >
                  <ChevronRight className="w-4 h-4 text-card-foreground" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Scanner modal / manual input */}
        {scannerOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
            <div className="bg-card rounded-2xl p-6 w-full max-w-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold">Verify Ticket</h3>
                <button
                  onClick={() => {
                    setScannerOpen(false);
                    setScannedTicket(null);
                  }}
                  className="text-muted-foreground"
                >
                  Close
                </button>
              </div>

              {!scannedTicket ? (
                <>
                  {/* QR Scanner temporarily commented out due to CORS issues */}
                  {/* <Suspense
                    fallback={
                      <div className="py-10 text-center">
                        Loading scanner...
                      </div>
                    }
                  >
                    <QRScanner
                      onDecode={(text) => {
                        handleScan(text);
                      }}
                      onClose={() => setScannerOpen(false)}
                    />
                  </Suspense> */}

                  <div className="mt-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      Enter Ticket ID to verify and mark attendance
                    </p>
                    <div className="flex gap-2">
                      <input
                        value={manualQr}
                        onChange={(e) => setManualQr(e.target.value)}
                        placeholder="Enter Ticket ID"
                        className="input-field flex-1"
                      />
                      <button
                        onClick={() => handleScanByTicketId(manualQr)}
                        className="btn-primary"
                      >
                        Verify & Mark
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-muted-foreground">Ticket ID</p>
                    <p className="font-mono font-medium text-primary">
                      {scannedTicket.ticket_id}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="font-medium">{scannedTicket.full_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm text-muted-foreground">
                      {scannedTicket.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p
                      className={`font-medium ${scannedTicket.scanned ? "text-green-600" : ""}`}
                    >
                      {scannedTicket.scanned ? "Scanned" : "Not scanned"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {!scannedTicket.scanned && (
                      <button
                        onClick={() => handleMarkUsed(scannedTicket.qr_code)}
                        className="btn-primary"
                      >
                        Mark as used
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setScannedTicket(null);
                      }}
                      className="text-sm text-muted-foreground"
                    >
                      Back
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;
