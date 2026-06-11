import React, { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Droplets, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Gift } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useRegisterMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "supplier" ? "supplier" : "customer";
  
  const [role, setRole] = useState(initialRole);
  const [name, setName] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [address, setAddress] = useState("");
  const [pincode, setPincode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [register, { isLoading }] = useRegisterMutation();

  const handleRegister = async (e) => {
    e.preventDefault();

    // Password policy validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({ 
        title: "Weak Password", 
        description: "Password must be at least 8 characters long and include 1 capital letter, 1 number, and 1 special symbol.", 
        variant: "destructive" 
      });
      return;
    }

    if (!pincode || pincode.length !== 6) {
      toast({
        title: "Invalid Pincode",
        description: "Please enter a valid 6-digit postal pincode for deliveries.",
        variant: "destructive"
      });
      return;
    }

    try {
      const payload = {
        name,
        email,
        password,
        phone,
        role,
        pincode,
        address,
        businessName: role === "supplier" ? businessName : undefined
      };

      const result = await register(payload).unwrap();
      const { token, user } = result;
      dispatch(setCredentials({ token, user }));

      toast({ 
        title: "Account created!", 
        description: `Registered successfully as a ${user.role}.` 
      });

      if (user.role === "customer") navigate("/customer");
      else if (user.role === "supplier") navigate("/supplier");
      else if (user.role === "admin") navigate("/admin");
    } catch (error) {
      const errMsg = error?.data?.error || error?.message || "Registration failed. Check inputs.";
      toast({ 
        title: "Registration failed", 
        description: errMsg, 
        variant: "destructive" 
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-slate-100">
      {/* Background gradients */}
      <div className="absolute top-20 right-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md relative z-10 my-8">
        <div className="bg-[#0e142e]/80 border border-white/5 shadow-2xl rounded-3xl p-8 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2.5 mb-6 justify-center group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              AquaHome
            </span>
          </Link>

          <h2 className="text-2xl font-bold mb-1 text-center text-white">Create Account</h2>
          <p className="text-slate-400 text-sm mb-5 text-center">Sign up to order or distribute water cans.</p>

          <div className="flex gap-1 p-1 rounded-xl bg-[#090d22] mb-5 border border-white/5">
            {[
              { r: "customer", label: "🚰 Customer" },
              { r: "supplier", label: "🚛 Supplier" }
            ].map(item => (
              <button 
                key={item.r} 
                type="button"
                onClick={() => setRole(item.r)}
                className={`flex-1 text-sm py-2.5 rounded-lg font-semibold transition-all duration-200 ${
                  role === item.r 
                    ? "bg-blue-600 text-white shadow-md shadow-blue-600/10" 
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-slate-300">{role === "supplier" ? "Contact Person Name" : "Full Name"}</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  id="name" 
                  placeholder={role === "supplier" ? "Ramesh Ganga" : "John Doe"} 
                  className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                  value={name} 
                  onChange={e => setName(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {role === "supplier" && (
              <div>
                <Label htmlFor="businessName" className="text-slate-300">Business Name</Label>
                <div className="relative mt-1">
                  <Truck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="businessName" 
                    placeholder="Ganga Water Suppliers Ltd" 
                    className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                    value={businessName} 
                    onChange={e => setBusinessName(e.target.value)} 
                    required 
                  />
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone" className="text-slate-300">Phone Number</Label>
                <div className="relative mt-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="phone" 
                    type="tel" 
                    placeholder="9876543210" 
                    className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                    value={phone} 
                    onChange={e => setPhone(e.target.value)} 
                    required 
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="pincode" className="text-slate-300">Pincode (6-Digits)</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="pincode" 
                    placeholder="411001" 
                    maxLength={6}
                    className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                    value={pincode} 
                    onChange={e => setPincode(e.target.value.replace(/\D/g, ""))} 
                    required 
                  />
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="email" className="text-slate-300">Email Address</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="you@example.com" 
                  className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                  value={email} 
                  onChange={e => setEmail(e.target.value)} 
                  required 
                />
              </div>
            </div>

            <div>
              <Label htmlFor="password" className="text-slate-300">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <Input 
                  id="password" 
                  type={showPw ? "text" : "password"} 
                  placeholder="••••••••" 
                  className="pl-10 pr-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                />
                <button 
                  type="button" 
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" 
                  onClick={() => setShowPw(!showPw)}
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1 px-1">
                Min. 8 characters, 1 capital, 1 number, 1 special symbol
              </p>
            </div>

            <div>
              <Label htmlFor="address" className="text-slate-300">{role === "supplier" ? "Office/Warehouse Address" : "Delivery Address"}</Label>
              <div className="relative mt-1">
                <Input 
                  id="address" 
                  placeholder="Street details, apartment, city" 
                  className="rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                  value={address} 
                  onChange={e => setAddress(e.target.value)} 
                  required 
                />
              </div>
            </div>

            {role === "customer" && (
              <div>
                <Label htmlFor="referral" className="text-slate-300">Referral Code (optional)</Label>
                <div className="relative mt-1">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input 
                    id="referral" 
                    placeholder="AQUA1234" 
                    className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500 uppercase" 
                    value={referralInput} 
                    onChange={e => setReferralInput(e.target.value.toUpperCase())} 
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Both you and your referrer earn 50 Rs credit!</p>
              </div>
            )}

            <Button 
              type="submit" 
              className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-blue-500/20 border-0 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-5">
            Already have an account? <Link to="/login" className="text-blue-400 font-semibold hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
