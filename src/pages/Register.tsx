import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Droplets, Mail, Lock, Eye, EyeOff, User, Phone, MapPin, Gift } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function Register() {
  const [searchParams] = useSearchParams();
  const initialRole = searchParams.get("role") === "supplier" ? "supplier" : "customer";
  const [role, setRole] = useState<"customer" | "supplier">(initialRole);
  const [name, setName] = useState("");
  const [referralInput, setReferralInput] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("");
  const [city, setCity] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Password policy validation
    const passwordRegex = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}[\]:;<>,.?~\\/-]).{8,}$/;
    if (!passwordRegex.test(password)) {
      toast({ 
        title: "Weak Password", 
        description: "Password must be at least 8 characters long and include 1 capital letter, 1 number, and 1 special symbol.", 
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Registration Error:", error);
      toast({ 
        title: "Registration failed", 
        description: error.message || "Please check your details and try again.", 
        variant: "destructive" 
      });
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      toast({ title: "Check your email", description: "Please verify your email to continue." });
      setLoading(false);
      return;
    }

    // Ensure profile is updated/created with all details
    await supabase.from("profiles").upsert({ 
      user_id: userId, 
      phone, 
      full_name: name,
      email: email 
    }, { onConflict: 'user_id' });

    await supabase.from("user_roles").insert({ user_id: userId, role });

    // Handle referral code
    if (referralInput.trim()) {
      const { data: referrerProfile } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("referral_code", referralInput.trim().toUpperCase())
        .single();
      if (referrerProfile) {
        await supabase.from("referrals").insert({
          referrer_id: referrerProfile.user_id,
          referred_id: userId,
          referral_code: referralInput.trim().toUpperCase(),
        } as any);
      }
    }

    if (role === "supplier") {
      const serviceArea = city ? `${area}, ${city}` : area;
      await supabase.from("suppliers").insert({
        user_id: userId,
        business_name: name,
        area: serviceArea,
        water_type: "RO Purified",
        pincode: "", // Initial placeholder, can be updated in profile
      });
    }

    toast({ title: "Account created!", description: `Registered as ${role}.` });
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-accent/8 via-background to-primary/8" />
      <div className="absolute top-20 right-20 w-72 h-72 bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative">
        <div className="glass-card rounded-3xl p-8">
          <Link to="/" className="flex items-center gap-2.5 mb-6 justify-center">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Droplets className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="font-heading font-bold text-xl">AquaHome</span>
          </Link>

          <h2 className="font-heading text-2xl font-bold mb-1 text-center">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-5 text-center">Sign up to order or deliver water tankers.</p>

          <div className="flex gap-1 p-1 rounded-xl bg-muted/60 mb-5">
            {(["customer", "supplier"] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 text-sm py-2.5 rounded-lg font-medium capitalize transition-all duration-200 ${
                  role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                }`}>
                {r === "customer" ? "🚰 Customer" : "🚛 Supplier"}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-3.5">
            <div>
              <Label htmlFor="name">{role === "supplier" ? "Business Name" : "Full Name"}</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder={role === "supplier" ? "Business Name" : "John Doe"} className="pl-10 rounded-xl" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="+91 98765 43210" className="pl-10 rounded-xl" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10 rounded-xl" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10 rounded-xl" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 px-1">
                Min. 8 characters, 1 uppercase, 1 number, 1 symbol
              </p>
            </div>
            {role === "supplier" && (
              <>
                <div>
                  <Label htmlFor="area">Service Area</Label>
                  <div className="relative mt-1">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="area" placeholder="e.g. Koramangala" className="pl-10 rounded-xl" value={area} onChange={e => setArea(e.target.value)} required />
                  </div>
                </div>
                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" placeholder="e.g. Bangalore" className="rounded-xl mt-1" value={city} onChange={e => setCity(e.target.value)} required />
                </div>
              </>
            )}
            {role === "customer" && (
              <div>
                <Label htmlFor="location">Your City / Area</Label>
                <div className="relative mt-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="location" placeholder="e.g. Koramangala, Bangalore" className="pl-10 rounded-xl" value={area} onChange={e => setArea(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Helps us find nearby tanker suppliers</p>
              </div>
            )}
            {role === "customer" && (
              <div>
                <Label htmlFor="referral">Referral Code (optional)</Label>
                <div className="relative mt-1">
                  <Gift className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="referral" placeholder="e.g. AQUA1234" className="pl-10 rounded-xl uppercase" value={referralInput} onChange={e => setReferralInput(e.target.value.toUpperCase())} />
                </div>
                <p className="text-xs text-muted-foreground mt-1">Both you and your friend earn ₹50!</p>
              </div>
            )}
            <Button type="submit" className="w-full rounded-xl" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-5">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
