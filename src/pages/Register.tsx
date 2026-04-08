import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Droplets, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
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
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [area, setArea] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // 1. Sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      toast({ title: "Registration failed", description: error.message, variant: "destructive" });
      setLoading(false);
      return;
    }

    const userId = data.user?.id;
    if (!userId) {
      toast({ title: "Check your email", description: "Please verify your email to continue." });
      setLoading(false);
      return;
    }

    // 2. Update profile with phone
    await supabase.from("profiles").update({ phone, full_name: name }).eq("user_id", userId);

    // 3. Assign role
    await supabase.from("user_roles").insert({ user_id: userId, role });

    // 4. If supplier, create supplier listing
    if (role === "supplier") {
      await supabase.from("suppliers").insert({
        user_id: userId,
        business_name: name,
        area,
        water_type: "RO Purified",
      });
    }

    toast({ title: "Account created!", description: `Registered as ${role}. Check your email to verify.` });
    navigate("/login");
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent to-primary items-center justify-center p-12">
        <div className="text-primary-foreground max-w-md">
          <Droplets className="h-12 w-12 mb-6" />
          <h1 className="font-heading text-4xl font-bold mb-4">Join AquaHome Today</h1>
          <p className="text-primary-foreground/80">Whether you're looking for clean water delivery or want to grow your water supply business, we've got you covered.</p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <Droplets className="h-7 w-7 text-primary" />
            <span className="font-heading font-bold text-xl">AquaHome</span>
          </Link>
          <h2 className="font-heading text-2xl font-bold mb-1">Create Account</h2>
          <p className="text-muted-foreground text-sm mb-6">Sign up to start ordering or delivering water.</p>

          <div className="flex gap-1 p-1 bg-muted rounded-lg mb-6">
            {(["customer", "supplier"] as const).map(r => (
              <button key={r} onClick={() => setRole(r)}
                className={`flex-1 text-sm py-2 rounded-md font-medium capitalize transition-colors ${role === r ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {r}
              </button>
            ))}
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="name">{role === "supplier" ? "Business Name" : "Full Name"}</Label>
              <div className="relative mt-1">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder={role === "supplier" ? "Your Business Name" : "John Doe"} className="pl-10" value={name} onChange={e => setName(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="phone" type="tel" placeholder="+91 98765 43210" className="pl-10" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="email" type="email" placeholder="you@example.com" className="pl-10" value={email} onChange={e => setEmail(e.target.value)} required />
              </div>
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <div className="relative mt-1">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••" className="pl-10 pr-10" value={password} onChange={e => setPassword(e.target.value)} required />
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" onClick={() => setShowPw(!showPw)}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            {role === "supplier" && (
              <div>
                <Label htmlFor="area">Service Area</Label>
                <Input id="area" placeholder="e.g. Koramangala, Bangalore" className="mt-1" value={area} onChange={e => setArea(e.target.value)} required />
              </div>
            )}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account? <Link to="/login" className="text-primary font-medium hover:underline">Log In</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
