import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Truck, Shield, Star, MapPin, CreditCard, ArrowRight, Users, Package } from "lucide-react";
import { Button } from "@/components/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: MapPin, title: "Find Nearby Suppliers", desc: "Browse verified water suppliers in your area with ratings and reviews." },
  { icon: Truck, title: "Real-Time Tracking", desc: "Track your delivery in real-time from confirmation to doorstep." },
  { icon: CreditCard, title: "Secure Payments", desc: "Pay online securely via UPI, cards, or net banking." },
  { icon: Shield, title: "Quality Assured", desc: "All suppliers are verified for water quality and hygiene standards." },
  { icon: Star, title: "Rate & Review", desc: "Share your experience to help others choose the best supplier." },
  { icon: Package, title: "Order History", desc: "View all past orders and download payment receipts anytime." },
];

const steps = [
  { num: "01", title: "Browse Suppliers", desc: "Search nearby water suppliers by location, type, and ratings." },
  { num: "02", title: "Place Your Order", desc: "Select quantity, delivery time, and confirm your order." },
  { num: "03", title: "Track & Receive", desc: "Track delivery in real-time and receive fresh water at your door." },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <Link to="/" className="flex items-center gap-2">
            <Droplets className="h-7 w-7 text-primary" />
            <span className="font-heading font-bold text-xl text-foreground">AquaHome</span>
          </Link>
          <div className="hidden md:flex items-center gap-6">
            <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            <Link to="/login">
              <Button variant="ghost" size="sm">Log In</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
          <div className="md:hidden flex gap-2">
            <Link to="/login"><Button variant="ghost" size="sm">Log In</Button></Link>
            <Link to="/register"><Button size="sm">Sign Up</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container mx-auto relative">
          <motion.div className="max-w-3xl mx-auto text-center" initial="hidden" animate="visible">
            <motion.div variants={fadeUp} custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Droplets className="h-4 w-4" /> Clean Water, Delivered Fresh
            </motion.div>
            <motion.h1 variants={fadeUp} custom={1} className="font-heading text-4xl md:text-6xl font-extrabold leading-tight mb-6">
              Pure Water at Your <span className="text-gradient">Doorstep</span>
            </motion.h1>
            <motion.p variants={fadeUp} custom={2} className="text-lg text-muted-foreground max-w-xl mx-auto mb-8">
              Connect with trusted local water suppliers. Order, track, and pay — all in one simple platform.
            </motion.p>
            <motion.div variants={fadeUp} custom={3} className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Order Water Now <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link to="/register?role=supplier">
                <Button variant="outline" size="lg" className="w-full sm:w-auto">
                  Join as Supplier
                </Button>
              </Link>
            </motion.div>
            <motion.div variants={fadeUp} custom={4} className="flex items-center justify-center gap-8 mt-12 text-sm text-muted-foreground">
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> 890+ Customers</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-primary" /> 48 Suppliers</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-primary" /> 4.6 Avg Rating</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">Everything You Need</h2>
            <p className="text-muted-foreground max-w-md mx-auto">A complete platform for ordering safe drinking water with ease.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }}
                className="p-6 rounded-xl bg-card border border-border hover:shadow-lg hover:border-primary/20 transition-all group">
                <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="text-center mb-14">
            <h2 className="font-heading text-3xl md:text-4xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground">Three simple steps to get fresh water delivered.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <motion.div key={s.num} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15 }}
                className="text-center">
                <div className="text-5xl font-heading font-extrabold text-primary/15 mb-2">{s.num}</div>
                <h3 className="font-heading font-semibold text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="rounded-2xl bg-gradient-to-r from-primary to-accent p-10 md:p-16 text-center">
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-primary-foreground mb-4">Ready to Get Started?</h2>
            <p className="text-primary-foreground/80 max-w-md mx-auto mb-8">Join hundreds of satisfied customers enjoying clean, fresh water delivered right to their doorstep.</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/register">
                <Button size="lg" variant="secondary" className="gap-2">Get Started Free <ArrowRight className="h-4 w-4" /></Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-10 px-4">
        <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <span className="font-heading font-bold text-foreground">AquaHome</span>
          </div>
          <p className="text-sm text-muted-foreground">© 2026 AquaHome. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
