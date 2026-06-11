import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Droplets, Mail, Phone, MapPin, Send, MessageSquare, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i) => ({ opacity: 1, y: 0, transition: { delay: i * 0.08, duration: 0.4 } }),
};

export default function ContactUs() {
  const { toast } = useToast();
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      toast({ title: "Incomplete details", description: "Please populate your name, email, and message.", variant: "destructive" });
      return;
    }

    setSubmitting(true);
    // Simulate API submission
    setTimeout(() => {
      setSubmitting(false);
      toast({
        title: "Message Sent! 📩",
        description: "Thank you for reaching out. AquaHome support will get back to you shortly."
      });
      // Clear form
      setForm({ name: "", email: "", subject: "", message: "" });
    }, 1200);
  };

  const contactDetails = [
    { icon: Phone, title: "Call Support", val: "+91 90000 00001", desc: "Mon-Sat (9 AM - 6 PM)" },
    { icon: Mail, title: "Email Address", val: "support@aquahome.com", desc: "Response in 24 hours" },
    { icon: MapPin, title: "Hub HQ Location", val: "Sunshine Apts, Pune, Maharashtra", desc: "Pincode service: 411001" },
  ];

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100 selection:bg-blue-600 selection:text-white relative overflow-y-auto overflow-x-hidden">
      {/* Background glowing gradients */}
      <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-10 left-1/4 w-[500px] h-[500px] bg-teal-500/10 rounded-full blur-3xl -z-10" />

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
          <div className="flex items-center gap-4">
            <Link to="/login">
              <Button variant="ghost" className="text-slate-300 hover:text-white hover:bg-white/5 rounded-xl">Log In</Button>
            </Link>
            <Link to="/register">
              <Button className="rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-medium shadow-md shadow-blue-500/10 border-0">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="pt-28 pb-20 px-6 max-w-6xl mx-auto relative z-10">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <motion.div 
          initial="hidden"
          animate="visible"
          className="grid lg:grid-cols-12 gap-10 items-start"
        >
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-8">
            <motion.div variants={fadeUp} custom={0}>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-4 uppercase tracking-widest">
                <MessageSquare className="h-3.5 w-3.5" /> Support Desk
              </span>
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">Contact Our Hydration Team</h1>
              <p className="text-slate-400 mt-4 leading-relaxed">
                Have questions about pincode availability, distributor registrations, or need help with custom tanker configurations? Drop us a line!
              </p>
            </motion.div>

            {/* Info Cards */}
            <div className="space-y-4">
              {contactDetails.map((det, idx) => (
                <motion.div 
                  key={det.title}
                  variants={fadeUp} 
                  custom={idx + 1}
                  className="flex items-start gap-4 p-4 rounded-2xl bg-[#0e142e]/60 border border-white/5 shadow-md"
                >
                  <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
                    <det.icon className="h-5 w-5 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white uppercase tracking-wider">{det.title}</h3>
                    <p className="text-base font-semibold text-blue-300 mt-1">{det.val}</p>
                    <p className="text-xs text-slate-500 mt-0.5 font-semibold">{det.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Right Form Column */}
          <motion.div 
            variants={fadeUp}
            custom={4}
            className="lg:col-span-7 bg-[#0e142e]/80 border border-white/5 shadow-2xl rounded-3xl p-6 sm:p-8 backdrop-blur-md"
          >
            <h2 className="text-2xl font-bold text-white mb-2">Send a Message</h2>
            <p className="text-slate-400 text-sm mb-6">Complete the details below and we will contact you shortly.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-slate-300">Your Name</Label>
                  <Input 
                    id="name"
                    placeholder="Enter name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-slate-300">Subject (Optional)</Label>
                <Input 
                  id="subject"
                  placeholder="What is this regarding?"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="mt-1.5 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-slate-300">Your Message</Label>
                <Textarea 
                  id="message"
                  placeholder="Type your questions or feedback here..."
                  rows={4}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="mt-1.5 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500 resize-none"
                  required
                />
              </div>

              <Button 
                type="submit"
                disabled={submitting}
                className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-bold shadow-lg shadow-blue-500/20 border-0 mt-4 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> {submitting ? "Sending message..." : "Submit Inquiry"}
              </Button>
            </form>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
