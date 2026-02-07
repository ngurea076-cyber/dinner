import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const navLinks = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/60 border-b border-border/50">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <a
          href="https://bidiigirlsprogramme.org"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-3"
          aria-label="Womens Day Dinner"
        >
          <img src="/logo.png" alt="Womens Day Dinner" className="h-8 w-auto" />
        </a>

        {/* Desktop links */}
        <div className="hidden sm:flex items-center gap-6">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.href}
              className={`text-sm font-medium transition-colors ${
                location.pathname === link.href
                  ? "text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {link.label}
            </Link>
          ))}
            <a
            href="https://www.google.com/maps/place/Radisson+Blu+Hotel,+Nairobi+Upper+Hill/@-1.3015887,36.8173125,16z/data=!4m9!3m8!1s0x182f10e51817c5bd:0x3a9709be7741fa63!5m2!4m1!1i2!8m2!3d-1.3022805!4d36.8167439!16s%2Fg%2F11b6jddqjw?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary text-sm py-2 px-5 inline-flex items-center gap-2"
          >
            <MapPin className="w-4 h-4" />
            Get Directions
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="sm:hidden text-foreground p-1"
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden overflow-hidden bg-background/95 backdrop-blur-md border-b border-border/50"
          >
            <div className="px-4 py-4 flex flex-col gap-3">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  onClick={() => setOpen(false)}
                  className={`text-sm font-medium py-2 transition-colors ${
                    location.pathname === link.href
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
                <a
                href="https://www.google.com/maps/place/Radisson+Blu+Hotel,+Nairobi+Upper+Hill/@-1.3015887,36.8173125,16z/data=!4m9!3m8!1s0x182f10e51817c5bd:0x3a9709be7741fa63!5m2!4m1!1i2!8m2!3d-1.3022805!4d36.8167439!16s%2Fg%2F11b6jddqjw?entry=ttu&g_ep=EgoyMDI2MDIwNC4wIKXMDSoKLDEwMDc5MjA2N0gBUAM%3D"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary text-sm py-3 text-center inline-flex items-center justify-center gap-2"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
