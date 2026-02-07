import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  DollarSign,
  Ticket,
  Clock,
  ShoppingCart,
  Search,
  Download,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

// Mock data
const MOCK_ORDERS = Array.from({ length: 24 }, (_, i) => ({
  ticketId: `TKT-${String(i + 1).padStart(4, "0")}`,
  fullName: ["John Doe", "Jane Smith", "Alice Mwangi", "Bob Ochieng", "Grace Wanjiku"][i % 5],
  email: `user${i + 1}@example.com`,
  phone: `2547${String(10000000 + i).slice(0, 8)}`,
  ticketType: (["single", "couple", "vip"] as const)[i % 3],
  quantity: (i % 3) + 1,
  totalAmount: [1500, 5000, 15000][i % 3],
  paymentStatus: (["paid", "pending", "failed"] as const)[i % 3],
  createdAt: new Date(Date.now() - i * 3600000).toISOString(),
}));

const statusColors: Record<string, string> = {
  paid: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  failed: "bg-red-100 text-red-800",
};

const AdminPage = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [page, setPage] = useState(1);
  const perPage = 8;

  const filtered = useMemo(() => {
    return MOCK_ORDERS.filter((o) => {
      const matchesSearch =
        !search ||
        o.fullName.toLowerCase().includes(search.toLowerCase()) ||
        o.ticketId.toLowerCase().includes(search.toLowerCase()) ||
        o.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === "all" || o.paymentStatus === statusFilter;
      const matchesType = typeFilter === "all" || o.ticketType === typeFilter;
      return matchesSearch && matchesStatus && matchesType;
    });
  }, [search, statusFilter, typeFilter]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  const stats = useMemo(() => ({
    revenue: MOCK_ORDERS.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.totalAmount, 0),
    sold: MOCK_ORDERS.filter((o) => o.paymentStatus === "paid").reduce((s, o) => s + o.quantity, 0),
    pending: MOCK_ORDERS.filter((o) => o.paymentStatus === "pending").length,
    total: MOCK_ORDERS.length,
  }), []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.email && loginForm.password) setIsLoggedIn(true);
  };

  const exportCSV = () => {
    const header = "Ticket ID,Name,Email,Phone,Type,Qty,Amount,Status,Date\n";
    const rows = filtered
      .map((o) => `${o.ticketId},${o.fullName},${o.email},${o.phone},${o.ticketType},${o.quantity},${o.totalAmount},${o.paymentStatus},${o.createdAt}`)
      .join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
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
          <h2 className="font-display text-2xl font-bold text-card-foreground text-center">Admin Login</h2>
          <input
            type="email"
            placeholder="Email"
            value={loginForm.email}
            onChange={(e) => setLoginForm((p) => ({ ...p, email: e.target.value }))}
            className="input-field"
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginForm.password}
            onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
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
    { label: "Total Revenue", value: `KES ${stats.revenue.toLocaleString()}`, icon: DollarSign },
    { label: "Tickets Sold", value: stats.sold, icon: Ticket },
    { label: "Pending", value: stats.pending, icon: Clock },
    { label: "Total Orders", value: stats.total, icon: ShoppingCart },
  ];

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="bg-card border-b border-border px-6 py-4 flex items-center justify-between sticky top-0 z-20">
        <h1 className="font-display text-xl font-bold text-primary">Purple Nights Admin</h1>
        <div className="flex gap-3">
          <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-card-foreground transition-colors">
            View Site
          </button>
          <button onClick={() => setIsLoggedIn(false)} className="text-sm text-destructive hover:text-destructive/80 transition-colors flex items-center gap-1">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 max-w-7xl mx-auto">
        {/* Stats */}
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
                <p className="text-xl font-bold text-card-foreground">{s.value}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="admin-card mb-6">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search orders..."
                className="input-field pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="input-field sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="input-field sm:w-40"
            >
              <option value="all">All Types</option>
              <option value="single">Single</option>
              <option value="couple">Couple</option>
              <option value="vip">VIP</option>
            </select>
            <button onClick={exportCSV} className="btn-primary flex items-center gap-2 text-sm py-3">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="admin-card overflow-x-auto">
          <table className="w-full min-w-[700px] text-sm">
            <thead>
              <tr className="border-b border-border">
                {["Ticket ID", "Name", "Email", "Phone", "Type", "Qty", "Amount", "Status", "Date"].map((h) => (
                  <th key={h} className="text-left py-3 px-3 font-semibold text-muted-foreground/70 text-xs uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((o) => (
                <tr key={o.ticketId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                  <td className="py-3 px-3 font-mono font-medium text-primary text-xs">{o.ticketId}</td>
                  <td className="py-3 px-3 text-card-foreground">{o.fullName}</td>
                  <td className="py-3 px-3 text-muted-foreground/80">{o.email}</td>
                  <td className="py-3 px-3 text-muted-foreground/80">{o.phone}</td>
                  <td className="py-3 px-3 capitalize text-card-foreground">{o.ticketType}</td>
                  <td className="py-3 px-3 text-card-foreground">{o.quantity}</td>
                  <td className="py-3 px-3 font-medium text-card-foreground">KES {o.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${statusColors[o.paymentStatus]}`}>
                      {o.paymentStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-muted-foreground/80 text-xs">
                    {new Date(o.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 mt-4 border-t border-border">
              <p className="text-sm text-muted-foreground/70">
                Showing {(page - 1) * perPage + 1}–{Math.min(page * perPage, filtered.length)} of {filtered.length}
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
      </div>
    </div>
  );
};

export default AdminPage;
