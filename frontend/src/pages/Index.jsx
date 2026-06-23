import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Truck, Shield, Star, MapPin, CreditCard, ArrowRight, Package, ChevronRight, Phone, Mail } from "lucide-react";
import { Button } from "@/ui/button";
import Navbar from "@/shared/components/Navbar";

const features = [
  { icon: MapPin,     title: "Location-Based Search", desc: "Find water can and tanker suppliers operating in your specific area pincode." },
  { icon: Truck,      title: "Super Fast Delivery",    desc: "Get fresh drinking water delivered directly to your doorstep within hours." },
  { icon: CreditCard, title: "Secure Payments",        desc: "Pay seamlessly with Cash on Delivery (COD) or online methods." },
  { icon: Shield,     title: "Verified Suppliers",     desc: "All local distributors are rigorously verified for hygiene, purity, and speed." },
  { icon: Star,       title: "Ratings & Reviews",      desc: "Browse ratings from other homeowners to pick the absolute best supplier." },
  { icon: Package,    title: "Live OTP Deliveries",    desc: "Secure your orders with auto-generated 4-digit OTPs verified on delivery." },
];

const steps = [
  { num: "01", title: "Set Your Pincode", desc: "Enter your neighborhood pincode to immediately browse active water suppliers." },
  { num: "02", title: "Fill Your Cart",   desc: "Add mineral cans, dispensers, or water bottles, and checkout in seconds." },
  { num: "03", title: "Verify with OTP", desc: "Receive water jars, share your 4-digit secure OTP, and enjoy clean hydration!" },
];

const stats = [
  { value: "1,200+", label: "Homes Served" },
  { value: "60+",    label: "Active Suppliers" },
  { value: "4.8★",   label: "Avg. Rating" },
  { value: "15 min", label: "Avg. Delivery" },
];

const fadeIn  = { hidden: { opacity: 0, y: 24 }, visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } } };
const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.09 } } };
const child   = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } } };
const scaleIn = { hidden: { opacity: 0, scale: 0.95 }, visible: { opacity: 1, scale: 1, transition: { duration: 0.55, ease: "easeOut" } } };

const WATER_WORDS = ["Cans", "Jars", "Tankers"];

function AnimatedWord() {
  const [wordIndex, setWordIndex] = useState(0);
  const [displayText, setDisplayText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    let timer;
    const currentWord = WATER_WORDS[wordIndex];

    if (isDeleting) {
      if (displayText === "") {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % WATER_WORDS.length);
      } else {
        timer = setTimeout(() => {
          setDisplayText(currentWord.substring(0, displayText.length - 1));
        }, 60);
      }
    } else {
      if (displayText === currentWord) {
        timer = setTimeout(() => {
          setIsDeleting(true);
        }, 1800);
      } else {
        timer = setTimeout(() => {
          setDisplayText(currentWord.substring(0, displayText.length + 1));
        }, 130);
      }
    }

    return () => clearTimeout(timer);
  }, [displayText, isDeleting, wordIndex]);

  return (
    <span className="text-blue-600 dark:text-blue-400 inline-block relative pr-1.5 font-heading">
      {displayText}
      <span className="inline-block w-[3px] h-[0.9em] bg-blue-600 dark:bg-blue-400 ml-0.5 align-middle animate-pulse" style={{ animationDuration: "1s" }} />
    </span>
  );
}

const LightOverlay = ({ opacity = "0.55" }) => (
  <div className="absolute inset-0 dark:hidden" style={{ background: `rgba(255,255,255,${opacity})` }} />
);
const DarkOverlay = ({ opacity = "0.60" }) => (
  <div className="absolute inset-0 hidden dark:block" style={{ background: `rgba(7,11,25,${opacity})` }} />
);

export default function Index() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <Navbar />

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 1 — hero-bg.png covers HERO + STATS seamlessly
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Single shared background for the whole zone */}
        <div className="absolute inset-0 z-0">
          <img src="/hero-bg.png" alt="" className="w-full h-full object-cover object-center" />
          <LightOverlay opacity="0.50" />
          <DarkOverlay  opacity="0.56" />
        </div>

        {/* HERO */}
        <section className="relative z-10 pt-36 pb-20 px-6 min-h-[88vh] flex items-center">
          <div className="max-w-7xl mx-auto w-full">
            <motion.div
              className="max-w-3xl mx-auto text-center"
              initial="hidden" animate="visible" variants={stagger}
            >
              <motion.div variants={child}
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full
                           bg-blue-600/10 dark:bg-blue-400/15 border border-blue-400/30
                           text-blue-700 dark:text-blue-300 text-xs font-semibold mb-8
                           uppercase tracking-widest backdrop-blur-sm"
              >
                <Droplets className="h-3.5 w-3.5" /> Pure Water Delivery Platform
              </motion.div>

              <motion.h1 variants={child}
                className="text-5xl md:text-7xl font-heading font-extrabold leading-[1.08] tracking-tight mb-6
                           text-gray-900 dark:text-white drop-shadow-sm"
              >
                Fresh Water <AnimatedWord /><br className="hidden sm:block" />
                <span className="text-blue-600 dark:text-blue-400"> Delivered Instantly</span>
              </motion.h1>

              <motion.p variants={child}
                className="text-lg text-gray-700 dark:text-slate-300 max-w-xl mx-auto mb-10 leading-relaxed font-medium"
              >
                Search water suppliers by pincode, order premium mineral jars, and secure deliveries
                with OTP verification — all in one place.
              </motion.p>

              <motion.div variants={child} className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register">
                  <Button size="lg"
                    className="gap-2 w-full sm:w-auto rounded-xl bg-blue-600 hover:bg-blue-700
                               text-white font-semibold py-6 px-8 shadow-lg border-0 transition-all duration-200"
                  >
                    Order Water Now <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/register?role=supplier">
                  <Button variant="outline" size="lg"
                    className="w-full sm:w-auto rounded-xl border-2 border-white/60 dark:border-white/30
                               bg-white/70 dark:bg-white/10 hover:bg-white/90 dark:hover:bg-white/20
                               text-gray-900 dark:text-white font-semibold py-6 px-8 backdrop-blur-sm transition-all duration-200"
                  >
                    Join as Distributor
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>

        {/* STATS — flush below hero, same bg zone */}
        <motion.div
          className="relative z-10 border-t border-white/20 dark:border-white/10"
          initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-40px" }} variants={stagger}
        >
          <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4">
            {stats.map((s, i) => (
              <motion.div key={s.label} variants={child}
                className={`py-10 px-6 text-center ${i < 3 ? "border-r border-white/20 dark:border-white/10" : ""}`}
              >
                <div className="text-3xl md:text-4xl font-heading font-extrabold text-gray-900 dark:text-white drop-shadow">{s.value}</div>
                <div className="text-sm text-gray-700 dark:text-slate-300 mt-1.5 font-semibold uppercase tracking-wider">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 2 — features-bg.png covers FEATURES alone
          ══════════════════════════════════════════════════════════════ */}
      <section id="features" className="relative py-28 px-6 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/features-bg.png" alt="" className="w-full h-full object-cover object-center" />
          <LightOverlay opacity="0.52" />
          <DarkOverlay  opacity="0.60" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <motion.div className="text-center mb-16"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeIn}
          >
            <p className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3">What We Offer</p>
            <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight text-gray-900 dark:text-white drop-shadow">
              Everything You Need for Clean Water
            </h2>
            <p className="text-gray-700 dark:text-slate-300 max-w-lg mx-auto font-medium">
              A complete platform connecting smart homes with the best verified water distributors in your area.
            </p>
          </motion.div>

          <motion.div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5"
            initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}
          >
            {features.map((f) => (
              <motion.div key={f.title} variants={child}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="p-6 rounded-2xl backdrop-blur-md border transition-all duration-300 group cursor-default shadow-md
                           bg-white/72 dark:bg-slate-900/72 border-white/60 dark:border-white/10
                           hover:bg-white/92 dark:hover:bg-slate-800/80 hover:shadow-xl hover:border-blue-300 dark:hover:border-blue-500/40"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-600/10 dark:bg-blue-400/15 border border-blue-500/20
                                flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="font-heading font-bold text-lg mb-2 text-gray-900 dark:text-white">{f.title}</h3>
                <p className="text-sm text-gray-600 dark:text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════
          ZONE 3 — cta-bg.png covers HOW IT WORKS + CTA seamlessly
          ══════════════════════════════════════════════════════════════ */}
      <div className="relative overflow-hidden">
        {/* Single shared background for the whole zone */}
        <div className="absolute inset-0 z-0">
          <img src="/cta-bg.png" alt="" className="w-full h-full object-cover object-bottom" />
          <div className="absolute inset-0" style={{ background: "rgba(29, 78, 216, 0.70)" }} />
        </div>

        {/* HOW IT WORKS */}
        <section id="how-it-works" className="relative z-10 py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div className="text-center mb-20"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={fadeIn}
            >
              <p className="text-sm font-bold text-blue-200 uppercase tracking-widest mb-3">Simple Process</p>
              <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 tracking-tight text-white drop-shadow-md">
                How It Works
              </h2>
              <p className="text-blue-100 font-medium">Get clean water in three simple steps.</p>
            </motion.div>

            <motion.div className="grid md:grid-cols-3 gap-10 relative"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-60px" }} variants={stagger}
            >
              {/* Connecting line */}
              <div className="hidden md:block absolute top-7 left-[calc(16.66%+28px)] right-[calc(16.66%+28px)] h-0.5 bg-white/30" />

              {steps.map((s) => (
                <motion.div key={s.num} variants={child} className="text-center relative">
                  <motion.div
                    className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-white
                               text-blue-700 font-heading font-bold text-xl mb-6 relative z-10 shadow-lg"
                    whileHover={{ scale: 1.12, transition: { duration: 0.2 } }}
                  >
                    {s.num}
                  </motion.div>
                  <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/25 shadow-md">
                    <h3 className="font-heading font-bold text-lg mb-2 text-white">{s.title}</h3>
                    <p className="text-sm text-blue-100 leading-relaxed">{s.desc}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* CTA — flush below how-it-works, same bg zone */}
        <section className="relative z-10 pb-28 px-6">
          <div className="border-t border-white/20 pt-20">
            <motion.div className="max-w-3xl mx-auto text-center"
              initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} variants={scaleIn}
            >
              <p className="text-blue-200 text-sm font-bold uppercase tracking-widest mb-4">Ready to Start?</p>
              <h2 className="text-4xl md:text-5xl font-heading font-bold text-white mb-5 tracking-tight drop-shadow-md">
                Start Hydrating Your Home Today
              </h2>
              <p className="text-blue-100 max-w-md mx-auto mb-10 leading-relaxed text-lg">
                Join thousands of households getting hygienically sealed, verified water cans delivered seamlessly.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/register">
                  <Button size="lg"
                    className="bg-white hover:bg-blue-50 text-blue-700 font-bold py-6 px-10 rounded-xl
                               shadow-xl transition-all duration-200 border-0"
                  >
                    Get Started Free <ChevronRight className="ml-1 h-4 w-4" />
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline"
                    className="border-2 border-white/40 bg-white/10 hover:bg-white/20 text-white
                               font-semibold py-6 px-8 rounded-xl backdrop-blur-sm transition-all duration-200"
                  >
                    Log In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* ── FOOTER ─────────────────────────────────────────────────────── */}
      <footer className="bg-background border-t border-border">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10 py-16">
            <div>
              <Link to="/" className="flex items-center gap-2 mb-4">
                <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-600 to-sky-500 flex items-center justify-center shadow-sm">
                  <Droplets className="h-4 w-4 text-white" />
                </div>
                <span className="font-heading font-bold text-lg text-foreground">AquaHome</span>
              </Link>
              <p className="text-sm text-muted-foreground leading-relaxed">
                India's trusted platform for clean drinking water delivery. Connecting homes with verified local suppliers.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Quick Links</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Features",         href: "/#features" },
                  { label: "How It Works",      href: "/#how-it-works" },
                  { label: "Become a Supplier", to:   "/register?role=supplier" },
                ].map((l) =>
                  l.to
                    ? <li key={l.label}><Link to={l.to}  className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
                    : <li key={l.label}><a   href={l.href} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</a></li>
                )}
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Account</h4>
              <ul className="space-y-2.5">
                {[
                  { label: "Log In",          to: "/login" },
                  { label: "Create Account",  to: "/register" },
                  { label: "Contact Support", to: "/contact" },
                ].map((l) => (
                  <li key={l.label}><Link to={l.to} className="text-sm text-muted-foreground hover:text-foreground transition-colors">{l.label}</Link></li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-semibold text-foreground mb-4 text-xs uppercase tracking-widest">Reach Us</h4>
              <ul className="space-y-3">
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Phone  className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> +91 90000 00001
                </li>
                <li className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Mail   className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0" /> support@aquahome.com
                </li>
                <li className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" /> Pune, Maharashtra
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">© 2026 AquaHome Water Delivery Network. All rights reserved.</p>
            <Link to="/contact" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Contact Us</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
