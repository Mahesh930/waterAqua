import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Droplets, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Gift, Truck, Shield, Star, CreditCard } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useRegisterMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";
import Navbar from "@/shared/components/Navbar";

const brandFeatures = [
  { icon: Shield,     title: "Verified Suppliers",  desc: "All distributors hygiene & quality certified" },
  { icon: CreditCard, title: "Secure Payments",     desc: "COD and online options available" },
  { icon: Star,       title: "Ratings & Reviews",   desc: "Rate and review every delivery" },
];

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "supplier" ? "supplier" : "customer";

  const [role, setRole]               = useState(initialRole);
  const [name, setName]               = useState("");
  const [businessName, setBusinessName] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [phone, setPhone]             = useState("");
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [address, setAddress]         = useState("");
  const [pincode, setPincode]         = useState("");
  const [showPw, setShowPw]           = useState(false);

  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { toast } = useToast();
  const [register, { isLoading }] = useRegisterMutation();

  const handleRegister = async (e) => {
    e.preventDefault();
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email.trim())) {
      toast({ title: "Invalid Email", description: "e.g. you@example.com", variant: "destructive" }); return;
    }
    const phoneClean = phone.replace(/\D/g, "");
    if (phoneClean.length !== 10) {
      toast({ title: "Invalid Phone", description: "Enter a valid 10-digit number.", variant: "destructive" }); return;
    }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({ title: "Weak Password", description: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number.", variant: "destructive" }); return;
    }
    if (!pincode || pincode.length !== 6) {
      toast({ title: "Invalid Pincode", description: "6-digit postal code required.", variant: "destructive" }); return;
    }
    try {
      const payload = {
        name: name.trim(), email: email.trim().toLowerCase(), password,
        phone: phoneClean, role, pincode, address,
        businessName: role === "supplier" ? businessName : undefined,
        referredByCode: referralInput || undefined,
      };
      const { token, user } = await register(payload).unwrap();
      dispatch(setCredentials({ token, user }));
      toast({ title: "Account created!", description: `Registered as ${user.role}.` });
      if (user.role === "customer") navigate("/customer");
      else if (user.role === "supplier") navigate("/supplier");
      else navigate("/admin");
    } catch (error) {
      let errMsg = "Registration failed. Check your inputs.";
      const errData = error?.data?.error;
      if (Array.isArray(errData)) errMsg = errData.map(e => e.message).join(". ");
      else if (typeof errData === "string") errMsg = errData;
      else if (error?.message) errMsg = error.message;
      toast({ title: "Registration failed", description: errMsg, variant: "destructive" });
    }
  };

  return (
    <div className="h-screen text-foreground overflow-hidden relative">
      {/* Background image */}
      <div className="absolute inset-0 z-0">
        <img src="/stats-bg.png" alt="" className="w-full h-full object-cover object-center" />
        <div className="absolute inset-0 dark:hidden"       style={{ background: "rgba(255,255,255,0.48)" }} />
        <div className="absolute inset-0 hidden dark:block" style={{ background: "rgba(7,11,25,0.72)" }} />
      </div>

      <div className="relative z-10 h-full">
        <Navbar />

        <div className="pt-16 h-full flex">

          {/* ── Left Brand Panel ──────────────────────────────── */}
          <div className="hidden lg:flex lg:w-4/12 relative flex-col justify-center px-12 xl:px-16 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 opacity-95 backdrop-blur-sm" />
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute top-12 -right-8 w-32 h-32 bg-white/5 rounded-full" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-8">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <span className="font-heading font-bold text-xl text-white">AquaHome</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-heading font-bold text-white leading-tight mb-3">
                {role === "supplier"
                  ? "Scale your water supply network."
                  : "Fresh hydration, delivered fast."}
              </h2>
              <p className="text-blue-100 leading-relaxed mb-8 text-sm">
                {role === "supplier"
                  ? "Connect with thousands of active households, manage deliveries effortlessly, and grow your local route business."
                  : "Join today to browse verified local suppliers, place instant repeat orders, and track deliveries with secure OTP validation."}
              </p>

              {/* Feature cards */}
              <div className="space-y-3">
                {brandFeatures.map((f) => (
                  <div key={f.title}
                    className="flex items-center gap-4 p-3.5 rounded-xl bg-white/10 border border-white/15 backdrop-blur-sm hover:bg-white/15 transition-colors duration-200"
                  >
                    <div className="h-9 w-9 rounded-lg bg-white/15 flex items-center justify-center shrink-0 shadow-inner">
                      <f.icon className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="text-white font-semibold text-sm">{f.title}</p>
                      <p className="text-blue-200 text-xs">{f.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Form Panel ──────────────────────────────── */}
          <div className="flex-1 flex items-center justify-center px-6 overflow-hidden">
            {/* Frosted glass card — full-height layout, fits all items without scrollbar */}
            <div className="w-full max-w-xl bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-blue-100 dark:border-white/10 p-7 h-[calc(100vh-6.5rem)] flex flex-col justify-between overflow-hidden">
              <div>
                <h2 className="text-2xl font-heading font-bold text-foreground tracking-tight">Create Account</h2>
                <p className="text-muted-foreground text-xs mt-0.5 mb-4">Set up your profile to get started.</p>

                {/* Role Toggle */}
                <div className="flex gap-1 p-1 rounded-lg bg-muted mb-4 border border-border">
                  {[
                    { r: "customer", label: "🚰 Customer Account" },
                    { r: "supplier", label: "🚛 Supplier Partner" },
                  ].map(item => (
                    <button key={item.r} type="button" onClick={() => setRole(item.r)}
                      className={`flex-1 text-xs py-2 rounded-md font-semibold transition-all duration-200 ${
                        role === item.r ? "bg-blue-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"
                      }`}>
                      {item.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleRegister} className="space-y-3.5">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5">
                    {/* Name */}
                    <div>
                      <Label htmlFor="name" className="text-foreground font-semibold text-xs">{role === "supplier" ? "Contact Person" : "Full Name"}</Label>
                      <div className="relative mt-1">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="name" placeholder={role === "supplier" ? "Ramesh Ganga" : "John Doe"}
                          className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={name} onChange={e => setName(e.target.value)} required />
                      </div>
                    </div>

                    {/* Phone */}
                    <div>
                      <Label htmlFor="phone" className="text-foreground font-semibold text-xs">Phone Number</Label>
                      <div className="relative mt-1">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="phone" type="tel" placeholder="9876543210" maxLength={10}
                          className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))} required />
                      </div>
                    </div>

                    {/* Email */}
                    <div>
                      <Label htmlFor="email" className="text-foreground font-semibold text-xs">Email Address</Label>
                      <div className="relative mt-1">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="email" type="email" placeholder="you@example.com"
                          className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={email} onChange={e => setEmail(e.target.value)} required />
                      </div>
                    </div>

                    {/* Pincode */}
                    <div>
                      <Label htmlFor="pincode" className="text-foreground font-semibold text-xs">Pincode</Label>
                      <div className="relative mt-1">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="pincode" placeholder="411001" maxLength={6}
                          className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ""))} required />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <Label htmlFor="password" className="text-foreground font-semibold text-xs">Password</Label>
                      <div className="relative mt-1">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                          className="pl-9 pr-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={password} onChange={e => setPassword(e.target.value)} required />
                        <button type="button" onClick={() => setShowPw(!showPw)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                          {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {/* Dynamic Field (Business Name or Referral Code) */}
                    {role === "supplier" ? (
                      <div>
                        <Label htmlFor="businessName" className="text-foreground font-semibold text-xs">Business Name</Label>
                        <div className="relative mt-1">
                          <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="businessName" placeholder="Ganga Water Suppliers Ltd"
                            className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={businessName} onChange={e => setBusinessName(e.target.value)} required />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <Label htmlFor="referral" className="text-foreground font-semibold text-xs">
                          Referral Code <span className="text-muted-foreground font-normal">(optional)</span>
                        </Label>
                        <div className="relative mt-1">
                          <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="referral" placeholder="AQUA1234"
                            className="pl-9 h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 uppercase shadow-sm"
                            value={referralInput} onChange={e => setReferralInput(e.target.value.toUpperCase())} />
                        </div>
                      </div>
                    )}

                    {/* Address (spanning both columns) */}
                    <div className="col-span-2">
                      <Label htmlFor="address" className="text-foreground font-semibold text-xs">
                        {role === "supplier" ? "Office/Warehouse Address" : "Delivery Address"}
                      </Label>
                      <div className="relative mt-1">
                        <Input id="address" placeholder="Street details, building/apartment, city"
                          className="h-9 text-sm rounded-lg bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                          value={address} onChange={e => setAddress(e.target.value)} required />
                      </div>
                    </div>
                  </div>

                  {/* Password / Referral helper texts as a single compact line */}
                  <div className="flex justify-between items-center text-[10px] text-muted-foreground px-0.5 pt-0.5">
                    <span>Min 8 chars, 1 uppercase, 1 lowercase, 1 number</span>
                    {role === "customer" && <span>Referral earns ₹50 credit!</span>}
                  </div>

                  <Button type="submit" disabled={isLoading}
                    className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm border-0 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-200 mt-2">
                    {isLoading ? "Creating Account..." : "Create Account"}
                  </Button>
                </form>
              </div>

              <p className="text-center text-xs text-muted-foreground mt-3">
                Already have an account?{" "}
                <Link to="/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Log In</Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
