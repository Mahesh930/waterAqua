import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Droplets, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound, Shield, Truck, Star } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";
import Navbar from "@/shared/components/Navbar";

const brandFeatures = [
  { icon: Shield, title: "Verified Suppliers", desc: "All distributors hygiene & quality certified" },
  { icon: Truck,  title: "Doorstep Delivery",  desc: "Fresh water within hours to your address" },
  { icon: Star,   title: "Top Rated Platform", desc: "4.8★ average from 1,200+ happy homes" },
];

export default function Login() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || searchParams.get("resetToken");
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);

  const navigate  = useNavigate();
  const dispatch  = useDispatch();
  const { toast } = useToast();

  const [login,         { isLoading: isLoginLoading   }] = useLoginMutation();
  const [forgotPassword,{ isLoading: isForgotLoading  }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetLoading   }] = useResetPasswordMutation();

  useEffect(() => {
    if (tokenParam) { setTokenInput(tokenParam); setMode("reset"); }
  }, [tokenParam]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const { token, user } = await login({ email, password }).unwrap();
      dispatch(setCredentials({ token, user }));
      toast({ title: "Welcome back!", description: `Logged in as ${user.role}` });
      if (user.role === "customer") navigate("/customer");
      else if (user.role === "supplier") navigate("/supplier");
      else navigate("/admin");
    } catch (error) {
      toast({ title: "Login failed", description: error?.data?.error || "Invalid credentials.", variant: "destructive" });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) { toast({ title: "Email required", description: "Enter your registered email.", variant: "destructive" }); return; }
    try {
      await forgotPassword({ email }).unwrap();
      toast({ title: "Reset link generated 🔑", description: "Check your email or server console for the reset link." });
    } catch (error) {
      toast({ title: "Request failed", description: error?.data?.error || "User not found.", variant: "destructive" });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!tokenInput) { toast({ title: "Token required", variant: "destructive" }); return; }
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      toast({ title: "Weak password", description: "Min 8 chars, 1 uppercase, 1 lowercase, 1 number.", variant: "destructive" }); return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords mismatch", variant: "destructive" }); return;
    }
    try {
      const result = await resetPassword({ token: tokenInput, password: newPassword }).unwrap();
      toast({ title: "Success! 🎉", description: result.message || "Password reset. Log in with your new credentials." });
      setNewPassword(""); setConfirmPassword(""); setTokenInput(""); setMode("login");
    } catch (error) {
      toast({ title: "Reset failed", description: error?.data?.error || "Invalid or expired token.", variant: "destructive" });
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
            {/* Premium background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-700 via-blue-600 to-sky-500 opacity-95 backdrop-blur-sm" />

            {/* Decorative circles */}
            <div className="absolute -bottom-16 -right-16 w-64 h-64 bg-white/5 rounded-full" />
            <div className="absolute top-12 -right-8 w-32 h-32 bg-white/5 rounded-full" />
            <div className="absolute top-1/2 -left-8 w-20 h-20 bg-white/5 rounded-full -translate-y-1/2" />

            <div className="relative z-10">
              <div className="flex items-center gap-2.5 mb-10">
                <div className="h-10 w-10 rounded-xl bg-white/20 flex items-center justify-center shadow-inner">
                  <Droplets className="h-5 w-5 text-white" />
                </div>
                <span className="font-heading font-bold text-xl text-white">AquaHome</span>
              </div>

              <h2 className="text-3xl xl:text-4xl font-heading font-bold text-white leading-tight mb-4">
                Welcome back to<br />your dashboard.
              </h2>
              <p className="text-blue-100 leading-relaxed mb-10 text-sm">
                Log in to manage your water jar orders, track active deliveries, and explore verified suppliers operating in your neighborhood.
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
            {/* Frosted glass form card matching Register container height */}
            <div className="w-full max-w-md bg-white/95 dark:bg-slate-900/90 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(8,112,184,0.12)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-blue-100 dark:border-white/10 p-8 h-[calc(100vh-6.5rem)] flex flex-col justify-between overflow-hidden">
              <div>
                {mode === "login" && (
                  <>
                    <h2 className="text-2xl font-heading font-bold mb-1 text-foreground tracking-tight">Welcome Back</h2>
                    <p className="text-muted-foreground text-xs mb-6">Enter your credentials to access your account.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                      <div>
                        <Label htmlFor="email" className="text-foreground font-semibold text-xs">Email Address</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="email" type="email" placeholder="you@example.com"
                            className="pl-9 rounded-lg h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center">
                          <Label htmlFor="password" className="text-foreground font-semibold text-xs">Password</Label>
                          <button type="button" onClick={() => setMode("forgot")}
                            className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold">
                            Forgot Password?
                          </button>
                        </div>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="password" type={showPw ? "text" : "password"} placeholder="••••••••"
                            className="pl-9 pr-9 rounded-lg h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowPw(!showPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <Button type="submit" disabled={isLoginLoading}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm border-0 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-200 mt-2">
                        {isLoginLoading ? "Logging in..." : "Log In"}
                      </Button>
                    </form>
                  </>
                )}

                {mode === "forgot" && (
                  <>
                    <h2 className="text-2xl font-heading font-bold mb-1 text-foreground tracking-tight">Reset Password</h2>
                    <p className="text-muted-foreground text-xs mb-6">Enter your email and we'll send a reset link.</p>
                    <form onSubmit={handleForgotPassword} className="space-y-4">
                      <div>
                        <Label htmlFor="forgot-email" className="text-foreground font-semibold text-xs">Email Address</Label>
                        <div className="relative mt-1">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="forgot-email" type="email" placeholder="you@example.com"
                            className="pl-9 rounded-lg h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                        </div>
                      </div>
                      <Button type="submit" disabled={isForgotLoading}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm border-0 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-200 mt-2">
                        {isForgotLoading ? "Sending..." : "Request Reset Link"}
                      </Button>
                    </form>
                    <button type="button" onClick={() => setMode("login")}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mx-auto mt-6 transition-colors duration-200">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Log In
                    </button>
                  </>
                )}

                {mode === "reset" && (
                  <>
                    <h2 className="text-2xl font-heading font-bold mb-1 text-foreground tracking-tight">Set New Password</h2>
                    <p className="text-muted-foreground text-xs mb-5">Create a new secure password.</p>
                    <form onSubmit={handleResetPassword} className="space-y-3.5">
                      <div>
                        <Label htmlFor="token" className="text-foreground font-semibold text-xs">Reset Token</Label>
                        <div className="relative mt-1">
                          <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="token" placeholder="40-char reset token"
                            className="pl-9 rounded-lg h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={tokenInput} onChange={e => setTokenInput(e.target.value)} required />
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="newPassword" className="text-foreground font-semibold text-xs">New Password</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="newPassword" type={showNewPw ? "text" : "password"} placeholder="••••••••"
                            className="pl-9 pr-9 h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={newPassword} onChange={e => setNewPassword(e.target.value)} required />
                          <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                            {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="confirmPassword" className="text-foreground font-semibold text-xs">Confirm Password</Label>
                        <div className="relative mt-1">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                          <Input id="confirmPassword" type="password" placeholder="••••••••"
                            className="pl-9 rounded-lg h-10 bg-background border-slate-200 dark:border-slate-800 focus-visible:ring-blue-500 shadow-sm"
                            value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required />
                        </div>
                      </div>
                      <Button type="submit" disabled={isResetLoading}
                        className="w-full h-10 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-sm border-0 shadow-md shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.99] transition-all duration-200 mt-2">
                        {isResetLoading ? "Updating..." : "Update Password"}
                      </Button>
                    </form>
                    <button type="button" onClick={() => setMode("login")}
                      className="flex items-center justify-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground mx-auto mt-5 transition-colors duration-200">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back to Log In
                    </button>
                  </>
                )}
              </div>

              {mode === "login" && (
                <p className="text-center text-xs text-muted-foreground mt-6">
                  Don't have an account?{" "}
                  <Link to="/register" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">Sign Up</Link>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
