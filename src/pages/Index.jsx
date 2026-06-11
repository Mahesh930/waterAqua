import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Truck, Shield, Star, MapPin, CreditCard, ArrowRight, Users, Package } from "lucide-react";
import { Button } from "@/ui/button";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

const features = [
  { icon: MapPin, title: "Location-Based Search", desc: "Find water can and tanker suppliers operating in your specific area pincode." },
  { icon: Truck, title: "Super Fast Delivery", desc: "Get fresh drinking water delivered directly to your doorstep within hours." },
  { icon: CreditCard, title: "Secure Payments", desc: "Pay seamlessly with Cash on Delivery (COD) or online methods." },
  { icon: Shield, title: "Verified Suppliers", desc: "All local distributors are rigorously verified for hygiene, purity, and speed." },
  { icon: Star, title: "Ratings & Reviews", desc: "Browse ratings from other homeowners to pick the absolute best supplier." },
  { icon: Package, title: "Live OTP Deliveries", desc: "Secure your orders with auto-generated 4-digit OTPs verified on delivery." },
];

const steps = [
  { num: "01", title: "Set Your Pincode", desc: "Enter your neighborhood pincode to immediately browse active water suppliers." },
  { num: "02", title: "Fill Your Cart", desc: "Add mineral cans, dispensers, or water bottles, and checkout in seconds." },
  { num: "03", title: "Verify with OTP", desc: "Receive water jars, share your 4-digit secure OTP, and enjoy clean hydration!" },
];

export default function Index() {
  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 selection:bg-blue-600 selection:text-white overflow-x-hidden relative">
      {/* Background gradients */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-3xl -z-10" />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 backdrop-blur-md bg-[#070b19]/70 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex items-center justify-between h-16 px-6">
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              AquaHome
            </span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-400 hover:text-white transition-colors">How It Works</a>
            <Link to="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-xl">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium shadow-lg shadow-blue-500/20 border-0 hover:scale-[1.02] transition-all duration-300">
                Get Started
              </Button>
            </Link>
          </div>
          <div className="md:hidden flex gap-2">
            <Link to="/login"><Button variant="ghost" size="sm" className="text-slate-300">Log In</Button></Link>
            <Link to="/register"><Button size="sm" className="rounded-xl bg-blue-600 text-white">Sign Up</Button></Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-36 pb-24 px-6 relative max-w-7xl mx-auto">
        <div className="text-center max-w-4xl mx-auto">
          <motion.div 
            initial="hidden" 
            animate="visible"
            className="flex flex-col items-center"
          >
            <motion.div 
              variants={fadeUp} 
              custom={0} 
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-8 uppercase tracking-widest"
            >
              <Droplets className="h-4 w-4 animate-pulse" /> Pure Water Delivery Platform
            </motion.div>
            
            <motion.h1 
              variants={fadeUp} 
              custom={1} 
              className="text-4xl md:text-7xl font-extrabold leading-tight tracking-tight mb-8"
            >
              Fresh Water Cans <br />
              <span className="bg-gradient-to-r from-blue-400 via-sky-300 to-teal-200 bg-clip-text text-transparent">
                Delivered Instantly
              </span>
            </motion.h1>
            
            <motion.p 
              variants={fadeUp} 
              custom={2} 
              className="text-lg text-slate-400 max-w-xl mx-auto mb-10 leading-relaxed"
            >
              Skip the calls! Search water suppliers by your pincode, order premium mineral jars, and secure your deliveries with seamless OTP verification.
            </motion.p>
            
            <motion.div 
              variants={fadeUp} 
              custom={3} 
              className="flex flex-col sm:flex-row gap-4 justify-center w-full sm:w-auto"
            >
              <Link to="/register">
                <Button size="lg" className="gap-2.5 w-full sm:w-auto rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold py-6 shadow-xl shadow-blue-500/25 border-0 hover:scale-[1.03] transition-all duration-300">
                  Order Water Now <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Link to="/register?role=supplier">
                <Button variant="outline" size="lg" className="w-full sm:w-auto rounded-xl border-white/10 hover:bg-white/5 text-slate-300 hover:text-white py-6">
                  Join as Distributor
                </Button>
              </Link>
            </motion.div>
            
            <motion.div 
              variants={fadeUp} 
              custom={4} 
              className="flex items-center justify-center gap-10 mt-16 text-sm font-medium text-slate-500"
            >
              <div className="flex items-center gap-2"><Users className="h-4 w-4 text-blue-400" /> 1,200+ Homes Served</div>
              <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-blue-400" /> 60+ Active Suppliers</div>
              <div className="flex items-center gap-2"><Star className="h-4 w-4 text-blue-400" /> 4.8 Customer Stars</div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 px-6 border-t border-white/5 bg-[#090e22]/50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">Hydration, Re-imagined</h2>
            <p className="text-slate-400 max-w-md mx-auto text-base">A complete digital pipeline matching smart homes with the best water distributors.</p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div 
                key={f.title} 
                initial={{ opacity: 0, y: 25 }} 
                whileInView={{ opacity: 1, y: 0 }} 
                viewport={{ once: true }} 
                transition={{ delay: i * 0.08, duration: 0.5 }}
                className="p-8 rounded-2xl bg-[#0e142e]/60 border border-white/5 hover:border-blue-500/20 hover:bg-[#0e142e] transition-all duration-300 group shadow-lg"
              >
                <div className="h-12 w-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <f.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-xl mb-3 text-white group-hover:text-blue-300 transition-colors">{f.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-extrabold mb-4 tracking-tight">How It Works</h2>
          <p className="text-slate-400">Pure, crisp drinking water in three simple ticks.</p>
        </div>
        
        <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
          {steps.map((s, i) => (
            <motion.div 
              key={s.num} 
              initial={{ opacity: 0, y: 20 }} 
              whileInView={{ opacity: 1, y: 0 }} 
              viewport={{ once: true }} 
              transition={{ delay: i * 0.15, duration: 0.5 }}
              className="text-center relative group"
            >
              <div className="text-7xl font-black bg-gradient-to-b from-blue-500/20 to-transparent bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-300 mb-4">{s.num}</div>
              <h3 className="font-bold text-xl mb-3 text-white">{s.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Call to action card */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-3xl bg-gradient-to-r from-blue-600 via-sky-600 to-teal-500 p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-500/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl" />
          
          <div className="relative z-10 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">Hydrate Your Home Today</h2>
            <p className="text-white/80 max-w-md mx-auto mb-10 text-base leading-relaxed">Join thousands of households getting hygienically sealed, verified water cans delivered seamlessly.</p>
            <Link to="/register">
              <Button size="lg" className="bg-white hover:bg-slate-100 text-blue-900 font-bold py-6 px-8 rounded-xl shadow-lg hover:scale-105 transition-transform duration-300">
                Get Started Free <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 bg-[#050814] py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-md shadow-blue-500/10">
              <Droplets className="h-4 w-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-wide text-white">AquaHome</span>
          </div>
          <p className="text-sm text-slate-500 font-medium">© 2026 AquaHome Water Delivery Network. Crafted with premium details.</p>
        </div>
      </footer>
    </div>
  );
}
