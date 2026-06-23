import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Phone, MapPin, Send, MessageSquare, ArrowLeft } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Textarea } from "@/ui/textarea";
import { useToast } from "@/shared/hooks/use-toast";
import Navbar from "@/shared/components/Navbar";

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
    <div className="relative min-h-screen bg-background text-foreground overflow-y-auto overflow-x-hidden">
      {/* Page background image */}
      <div className="fixed inset-0 z-0">
        <img src="/stats-bg.png" alt="" className="w-full h-full object-cover object-center" />
        {/* Light mode overlay */}
        <div className="absolute inset-0 dark:hidden" style={{ background: "rgba(255,255,255,0.72)" }} />
        {/* Dark mode overlay */}
        <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(7,11,25,0.75)" }} />
      </div>

      <Navbar />

      {/* Main Content */}
      <div className="relative z-10 pt-28 pb-20 px-6 max-w-6xl mx-auto">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 group">
          <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
        </Link>

        <div className="grid lg:grid-cols-12 gap-10 items-start">
          {/* Left Info Column */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4 uppercase tracking-widest">
                <MessageSquare className="h-3.5 w-3.5" /> Support Desk
              </span>
              <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground tracking-tight">Contact Our Team</h1>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Have questions about pincode availability, distributor registrations, or need help with custom tanker configurations? Drop us a line!
              </p>
            </div>

            {/* Info Cards */}
            <div className="space-y-3">
              {contactDetails.map((det) => (
                <div 
                  key={det.title}
                  className="flex items-start gap-4 p-4 rounded-xl bg-card border border-border"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-100 dark:border-blue-500/20 flex items-center justify-center shrink-0">
                    <det.icon className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">{det.title}</h3>
                    <p className="text-base font-semibold text-blue-600 dark:text-blue-400 mt-1">{det.val}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium">{det.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Form Column */}
          <div className="lg:col-span-7 bg-card border border-border shadow-lg rounded-2xl p-6 sm:p-8">
            <h2 className="text-2xl font-heading font-bold text-foreground mb-2">Send a Message</h2>
            <p className="text-muted-foreground text-sm mb-6">Complete the details below and we will contact you shortly.</p>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-foreground font-medium">Your Name</Label>
                  <Input 
                    id="name"
                    placeholder="Enter name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="mt-1.5 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-blue-500 h-11"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email" className="text-foreground font-medium">Email Address</Label>
                  <Input 
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={e => setForm({ ...form, email: e.target.value })}
                    className="mt-1.5 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-blue-500 h-11"
                    required
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="subject" className="text-foreground font-medium">Subject (Optional)</Label>
                <Input 
                  id="subject"
                  placeholder="What is this regarding?"
                  value={form.subject}
                  onChange={e => setForm({ ...form, subject: e.target.value })}
                  className="mt-1.5 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-blue-500 h-11"
                />
              </div>

              <div>
                <Label htmlFor="message" className="text-foreground font-medium">Your Message</Label>
                <Textarea 
                  id="message"
                  placeholder="Type your questions or feedback here..."
                  rows={4}
                  value={form.message}
                  onChange={e => setForm({ ...form, message: e.target.value })}
                  className="mt-1.5 rounded-lg bg-background border-border text-foreground placeholder:text-muted-foreground/60 focus-visible:ring-blue-500 resize-none"
                  required
                />
              </div>

              <Button 
                type="submit"
                disabled={submitting}
                className="w-full h-11 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold border-0 transition-colors duration-200 mt-2 flex items-center justify-center gap-2"
              >
                <Send className="h-4 w-4" /> {submitting ? "Sending message..." : "Submit Inquiry"}
              </Button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
