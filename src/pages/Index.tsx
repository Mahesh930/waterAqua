import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Truck, Shield, Star, MapPin, CreditCard, ArrowRight, Users, Package, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: MapPin, title: "Location-Based Search", desc: "Find water tanker suppliers operating in your city and area." },
  { icon: Truck, title: "Fast Tanker Delivery", desc: "Get water tankers delivered to your location within hours." },
  { icon: CreditCard, title: "Easy Payments", desc: "Pay online securely via UPI, cards, or net banking." },
  { icon: Shield, title: "Verified Suppliers", desc: "All tanker suppliers are verified for quality and reliability." },
  { icon: Star, title: "Rate & Review", desc: "Share your experience to help others choose the best supplier." },
  { icon: Package, title: "Order Tracking", desc: "Track your tanker order status from placement to delivery." },
];

const steps = [
  { num: "01", title: "Set Your Location", desc: "Enter your city and area to find nearby water tanker suppliers." },
  { num: "02", title: "Choose & Order", desc: "Select a supplier, set quantity, and place your tanker order." },
  { num: "03", title: "Get Delivered", desc: "Track your tanker and receive fresh water at your doorstep." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass-strong">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">AquaHome</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm" className="rounded-xl">Get Started</Button>
            </Link>
          </div>
          <div className="md:hidden flex gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link to="/register"><Button size="sm" className="rounded-xl">Sign Up</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-transparent to-accent/8" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full glass text-sm font-medium mb-6">
              <Droplets className="h-4 w-4 text-primary" /> Water Tanker Ordering Platform
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Water Tankers <span className="text-gradient">Delivered Fast</span> to Your Location
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Order water tankers from trusted local suppliers. Set your location, pick a supplier, and get fresh water delivered to your doorstep.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto rounded-xl shadow-lg shadow-primary/25">
                  Order a Tanker <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register?role=supplier">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl glass">
                  Register as Supplier
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 890+ Customers</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> 48 Suppliers</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.6 Rating</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A complete platform for ordering water tankers with ease.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-2xl glass-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group cursor-default">
                <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-primary/15 to-accent/15 flex items-center justify-center mb-4 group-hover:from-primary/25 group-hover:to-accent/25 transition-colors">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to get water tankers delivered.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center relative">
                <div className="text-6xl font-heading font-extrabold text-primary/10 mb-3">{s.num}</div>
                <h3 className="font-heading font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-3xl bg-gradient-to-r from-primary to-accent p-10 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
            <div className="relative">
              <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Order Your First Tanker?</h2>
              <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">Join hundreds of satisfied customers enjoying clean, fresh water delivered by tanker.</p>
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2 rounded-xl">Get Started Free <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Droplets className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold">AquaHome</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 AquaHome. Water Tanker Ordering Platform.</p>
        </div>
      </footer>
    </div>
  );
}
