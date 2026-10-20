import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Leaf, MapPin, Moon, Server, Sun, Menu, X, Compass, ChevronRight, ShieldCheck, GraduationCap, CheckCircle2 } from "lucide-react";
import EvidenceBadge from "@/components/EvidenceBadge";
import { useLocationStore } from "@/lib/useLocationStore";
import { apiGet } from "@/lib/api";
import { getPageTitle } from "@/lib/useDocumentTitle";

const navItems = [
  ["Home", "/"], ["Survey", "/survey"], ["Dashboard", "/dashboard"], ["Experiment", "/experiment"],
  ["Map & Satellite", "/map"], ["Story", "/story"], ["Sources", "/sources"],
] as const;

export default function SiteShell({ 
  children,
  title,
}: { 
  children: ReactNode;
  title?: string;
}) {
  const [dark, setDark] = useState(() => localStorage.getItem("soiltrace-theme") === "dark");
  const { location } = useLocationStore();
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const routerLocation = useLocation();

  // Dynamic Browser Tab / Document Title
  useEffect(() => {
    document.title = getPageTitle(routerLocation.pathname, title);
  }, [routerLocation.pathname, title]);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [routerLocation.pathname]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("soiltrace-theme", dark ? "dark" : "light");
  }, [dark]);

  useEffect(() => {
    apiGet<{ status: string }>("/health")
      .then((res) => setBackendOnline(res?.status === "online"))
      .catch(() => setBackendOnline(false));
  }, []);

  return (
    <div className="min-h-svh paper-texture text-ink">
      <a href="#main-content" data-testid="skip-to-content" className="sr-only z-50 rounded bg-ink px-4 py-2 text-paper focus:not-sr-only focus:fixed focus:left-4 focus:top-4">
        Skip to content
      </a>
      <header data-testid="site-header" className="sticky top-0 z-40 border-b border-ink/10 bg-paper/95 backdrop-blur-md dark:border-paper/10 dark:bg-ink/95">
        <div className="mx-auto flex max-w-[1440px] items-center justify-between gap-2.5 px-3.5 py-2.5 sm:px-6 sm:py-3 lg:px-12">
          {/* Logo Brand */}
          <Link to="/" data-testid="brand-home-link" className="flex items-center gap-2 text-ink transition-transform duration-200 hover:-translate-y-0.5 shrink-0">
            <span className="flex size-8 items-center justify-center rounded-full border border-leaf/50 bg-leaf/10 text-leaf">
              <Leaf size={16} aria-hidden="true" />
            </span>
            <span className="font-serif text-lg sm:text-xl font-semibold tracking-tight">SoilTrace</span>
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.2em] text-muted md:inline">pan-india notebook / 01</span>
          </Link>

          {/* Center Navigation Links (Desktop) */}
          <nav aria-label="Primary navigation" data-testid="primary-navigation" className="hidden lg:flex items-center gap-1">
            {navItems.map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                data-testid={`nav-${label.toLowerCase().replaceAll(" ", "-")}-link`}
                className={({ isActive }) => `whitespace-nowrap rounded-sm px-2.5 py-1.5 font-mono text-[11px] uppercase tracking-wider transition-colors duration-200 ${
                  isActive ? "bg-leaf text-paper font-semibold" : "text-muted hover:bg-leaf/10 hover:text-leaf"
                }`}
              >
                {label}
              </NavLink>
            ))}
          </nav>

          {/* Right Controls: Location, Backend Status & Theme Toggle */}
          <div className="flex items-center gap-2 sm:gap-2.5">
            {/* Dynamic Active Location Pill */}
            <Link
              to="/map"
              title="Click to view and switch location"
              className="flex items-center gap-1.5 rounded-full border border-leaf/30 bg-leaf/10 px-2.5 py-1 text-[11px] sm:text-xs font-mono text-leaf hover:bg-leaf hover:text-paper transition-colors shrink-0 max-w-[140px] sm:max-w-[220px] truncate"
            >
              <MapPin size={12} className="shrink-0" />
              <span className="truncate">{location.city}, {location.state}</span>
            </Link>


            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={() => setDark((value) => !value)}
              data-testid="theme-toggle"
              aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="flex size-8 sm:size-9 items-center justify-center rounded-full border border-ink/20 text-muted transition-all duration-200 hover:-translate-y-0.5 hover:border-leaf hover:text-leaf cursor-pointer shrink-0"
            >
              {dark ? <Sun size={15} aria-hidden="true" /> : <Moon size={15} aria-hidden="true" />}
            </button>

            {/* Mobile & Tablet Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
              className="flex lg:hidden size-8 sm:size-9 items-center justify-center rounded-sm border border-ink/20 text-ink hover:border-leaf hover:text-leaf transition-colors cursor-pointer shrink-0"
            >
              {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>

        {/* Mobile & Tablet Fast Horizontal Tab Bar (Always accessible when menu is closed) */}
        <div className="lg:hidden border-t border-ink/10 bg-paper/60 px-2 py-1.5 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max">
            {navItems.map(([label, href]) => (
              <NavLink
                key={href}
                to={href}
                className={({ isActive }) => `whitespace-nowrap rounded-sm px-2.5 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors ${
                  isActive ? "bg-leaf text-paper font-bold shadow-xs" : "text-muted hover:bg-leaf/10 hover:text-leaf"
                }`}
              >
                {label}
              </NavLink>
            ))}
          </div>
        </div>

        {/* Mobile Dropdown Drawer Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-ink/15 bg-paper/98 backdrop-blur-lg px-4 py-4 space-y-3 shadow-xl animate-in slide-in-from-top-2 duration-150">
            <div className="grid grid-cols-2 gap-2">
              {navItems.map(([label, href]) => (
                <NavLink
                  key={href}
                  to={href}
                  className={({ isActive }) => `flex items-center justify-between p-2.5 rounded-sm border text-xs font-mono uppercase tracking-wider transition-all ${
                    isActive
                      ? "bg-leaf text-paper border-leaf font-bold shadow-xs"
                      : "border-ink/15 bg-paper/80 text-ink hover:border-leaf"
                  }`}
                >
                  <span>{label}</span>
                  <ChevronRight size={13} className="opacity-60" />
                </NavLink>
              ))}
            </div>

            <div className="pt-2 border-t border-ink/10 flex items-center justify-between text-xs font-mono text-muted">
              <div className="flex items-center gap-1.5">
                <Server size={12} className={backendOnline ? "text-leaf" : "text-amber"} />
                <span>Backend: <b className={backendOnline ? "text-leaf" : "text-amber"}>{backendOnline ? "Online" : "Fallback"}</b></span>
              </div>
              <div className="flex items-center gap-1.5 text-leaf">
                <Compass size={12} />
                <span>Active: <b>{location.district}</b></span>
              </div>
            </div>
          </div>
        )}
      </header>

      <main id="main-content" data-testid="main-content" className="mx-auto max-w-[1440px] px-3.5 py-6 sm:px-6 sm:py-8 lg:px-12 lg:py-12">
        {children}
      </main>

      <footer data-testid="site-footer" className="border-t border-ink/10 px-4 py-8 dark:border-paper/10 sm:px-8 lg:px-12 bg-paper/60 dark:bg-ink/60">
        <div className="mx-auto max-w-[1440px] space-y-6">
          {/* LPU Student Innovation & Authorship Credential Card */}
          <div
            data-testid="lpu-authorship-card"
            className="p-5 sm:p-6 rounded-lg border border-ink/15 bg-paper dark:bg-ink/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6"
          >
            <div className="flex items-start sm:items-center gap-4">
              <div className="relative shrink-0 rounded-full p-1 bg-white border border-ink/15 shadow-xs w-14 h-14 sm:w-16 sm:h-16 flex items-center justify-center overflow-hidden">
                <img
                  src="/lpu-round-logo.png"
                  alt="Lovely Professional University (LPU) Round Seal Logo"
                  className="w-full h-full object-contain rounded-full"
                  loading="lazy"
                />
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-amber font-bold">
                    STUDENT INNOVATION INITIATIVE
                  </span>
                  <span className="inline-flex items-center gap-1 font-mono text-[10px] text-leaf bg-leaf/10 border border-leaf/20 px-2 py-0.5 rounded-full font-semibold">
                    <ShieldCheck size={11} /> Authenticity Certified
                  </span>
                </div>
                <h3 className="font-serif text-lg sm:text-xl font-bold text-ink dark:text-paper leading-snug">
                  A Project by Lovely Professional University Students
                </h3>
                <p className="text-xs text-muted font-mono">
                  Lovely Professional University (LPU) &bull; Department of Computer Science & Engineering
                </p>
              </div>
            </div>

            {/* Students Names & Authenticity Seal */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-2">
                {["Hitesh A", "Gaurav Kumar", "Debjyoti Dhali"].map((name) => (
                  <div
                    key={name}
                    className="flex items-center gap-2 px-3 py-1.5 rounded border border-ink/15 bg-ink/5 dark:bg-paper/5 text-xs font-mono font-bold text-ink dark:text-paper"
                  >
                    <GraduationCap size={14} className="text-leaf shrink-0" />
                    <span>{name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Lower Footer Details & Evidence Badge */}
          <div className="flex flex-col gap-3 pt-4 border-t border-ink/10 dark:border-paper/10 sm:flex-row sm:items-center sm:justify-between text-xs font-mono text-muted">
            <p data-testid="footer-disclaimer" className="max-w-2xl leading-relaxed">
              SoilTrace &bull; Student Innovation Project at Lovely Professional University. Engineered with Vite + React, TailwindCSS tokens, and FastAPI backend. Grounded in published CPCB, ICAR, and MoA&FW statutory registries.
            </p>
            <div className="flex items-center gap-3 shrink-0">
              <span className="text-[11px] text-leaf font-semibold flex items-center gap-1">
                <CheckCircle2 size={13} /> LPU Certified Authentic
              </span>
              <EvidenceBadge status="verified" />
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}