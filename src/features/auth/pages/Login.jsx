import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Droplets, Mail, Lock, Eye, EyeOff, ArrowLeft, KeyRound } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useLoginMutation, useForgotPasswordMutation, useResetPasswordMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";

export default function Login() {
  const [searchParams] = useSearchParams();
  const tokenParam = searchParams.get("token") || searchParams.get("resetToken");
  
  const [mode, setMode] = useState("login"); // 'login' | 'forgot' | 'reset'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [login, { isLoading: isLoginLoading }] = useLoginMutation();
  const [forgotPassword, { isLoading: isForgotLoading }] = useForgotPasswordMutation();
  const [resetPassword, { isLoading: isResetLoading }] = useResetPasswordMutation();

  // If a token is supplied in the URL query string, automatically switch to reset mode
  useEffect(() => {
    if (tokenParam) {
      setTokenInput(tokenParam);
      setMode("reset");
    }
  }, [tokenParam]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const result = await login({ email, password }).unwrap();
      const { token, user } = result;
      dispatch(setCredentials({ token, user }));

      toast({ 
        title: "Welcome back!", 
        description: `Logged in as ${user.role}` 
      });

      if (user.role === "customer") navigate("/customer");
      else if (user.role === "supplier") navigate("/supplier");
      else if (user.role === "admin") navigate("/admin");
    } catch (error) {
      const errMsg = error?.data?.error || error?.message || "Invalid credentials. Try again.";
      toast({ 
        title: "Login failed", 
        description: errMsg, 
        variant: "destructive" 
      });
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      toast({ title: "Email required", description: "Please enter your registered email address.", variant: "destructive" });
      return;
    }
    try {
      const result = await forgotPassword({ email }).unwrap();
      
      // Captured resetToken directly from response for smooth local testing
      const testToken = result.resetToken;
      if (testToken) {
        setTokenInput(testToken);
      }

      toast({
        title: "Reset link generated 🔑",
        description: result.message || "A reset link has been logged in system server console."
      });

      // Transition to reset mode
      setMode("reset");
    } catch (error) {
      toast({
        title: "Request failed",
        description: error?.data?.error || error?.message || "User not found or database error",
        variant: "destructive"
      });
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!tokenInput) {
      toast({ title: "Token required", description: "Please provide a valid password reset token.", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Weak password", description: "Password must be at least 6 characters long.", variant: "destructive" });
      return;
    }
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords mismatch", description: "Confirm password does not match the new password.", variant: "destructive" });
      return;
    }

    try {
      const result = await resetPassword({ token: tokenInput, password: newPassword }).unwrap();
      toast({
        title: "Success! 🎉",
        description: result.message || "Your password has been reset. You can now login with your new credentials."
      });
      // Reset state and return to login
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTokenInput("");
      setMode("login");
    } catch (error) {
      toast({
        title: "Reset failed",
        description: error?.data?.error || error?.message || "Invalid or expired reset token",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-slate-100">
      {/* Visual backgrounds */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0e142e]/80 border border-white/5 shadow-2xl rounded-3xl p-8 backdrop-blur-md">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              AquaHome
            </span>
          </Link>

          {mode === "login" && (
            <>
              <h2 className="text-2xl font-bold mb-1 text-center text-white">Welcome Back</h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Log in to manage your water jar orders.</p>

              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-slate-300">Email</Label>
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
                  <div className="flex justify-between items-center">
                    <Label htmlFor="password" className="text-slate-300">Password</Label>
                    <button 
                      type="button" 
                      onClick={() => setMode("forgot")}
                      className="text-xs text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                    >
                      Forgot Password?
                    </button>
                  </div>
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
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-blue-500/20 border-0 mt-6" 
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? "Logging in..." : "Log In"}
                </Button>
              </form>

              <p className="text-center text-sm text-slate-400 mt-6">
                Don't have an account? <Link to="/register" className="text-blue-400 font-semibold hover:underline">Sign Up</Link>
              </p>
            </>
          )}

          {mode === "forgot" && (
            <>
              <h2 className="text-2xl font-bold mb-1 text-center text-white">Reset Password</h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Enter your email and we'll help you configure a new password.</p>

              <form onSubmit={handleForgotPassword} className="space-y-4">
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
                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-blue-500/20 border-0 mt-6" 
                  disabled={isForgotLoading}
                >
                  {isForgotLoading ? "Generating Token..." : "Request Reset Link"}
                </Button>
              </form>

              <button 
                type="button" 
                onClick={() => setMode("login")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mx-auto mt-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Log In
              </button>
            </>
          )}

          {mode === "reset" && (
            <>
              <h2 className="text-2xl font-bold mb-1 text-center text-white">Set New Password</h2>
              <p className="text-slate-400 text-sm mb-6 text-center">Configure your new secure password credential.</p>

              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <Label htmlFor="token" className="text-slate-300">Reset Token</Label>
                  <div className="relative mt-1">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="token" 
                      type="text" 
                      placeholder="Enter the 40-char reset token" 
                      className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                      value={tokenInput} 
                      onChange={e => setTokenInput(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="newPassword" className="text-slate-300">New Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="newPassword" 
                      type={showNewPw ? "text" : "password"} 
                      placeholder="••••••••" 
                      className="pl-10 pr-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                      value={newPassword} 
                      onChange={e => setNewPassword(e.target.value)} 
                      required 
                    />
                    <button 
                      type="button" 
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300" 
                      onClick={() => setShowNewPw(!showNewPw)}
                    >
                      {showNewPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="confirmPassword" className="text-slate-300">Confirm Password</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <Input 
                      id="confirmPassword" 
                      type="password" 
                      placeholder="••••••••" 
                      className="pl-10 rounded-xl bg-[#090d22] border-white/5 text-white placeholder-slate-600 focus-visible:ring-blue-500" 
                      value={confirmPassword} 
                      onChange={e => setConfirmPassword(e.target.value)} 
                      required 
                    />
                  </div>
                </div>
                <Button 
                  type="submit" 
                  className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-blue-500/20 border-0 mt-6" 
                  disabled={isResetLoading}
                >
                  {isResetLoading ? "Updating Password..." : "Update Password"}
                </Button>
              </form>

              <button 
                type="button" 
                onClick={() => setMode("login")}
                className="flex items-center gap-2 text-sm text-slate-400 hover:text-white mx-auto mt-6 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" /> Back to Log In
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
