import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { Droplets, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { Button } from "@/ui/button";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { useToast } from "@/shared/hooks/use-toast";
import { useLoginMutation } from "@/store/api";
import { setCredentials } from "@/store/authSlice";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { toast } = useToast();

  const [login, { isLoading }] = useLoginMutation();

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

  return (
    <div className="min-h-screen bg-[#070b19] flex items-center justify-center p-4 relative overflow-y-auto overflow-x-hidden text-slate-100">
      {/* Visual backgrounds */}
      <div className="absolute top-20 left-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl -z-10" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-[#0e142e]/80 border border-white/5 shadow-2xl rounded-3xl p-8 backdrop-blur-md">
          <Link to="/" className="flex items-center gap-2.5 mb-8 justify-center group">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
              <Droplets className="h-5 w-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-wide bg-gradient-to-r from-white via-slate-100 to-blue-200 bg-clip-text text-transparent">
              AquaHome
            </span>
          </Link>

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
            </div>
            <Button 
              type="submit" 
              className="w-full py-6 rounded-xl bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-500 hover:to-sky-400 text-white font-semibold shadow-lg shadow-blue-500/20 border-0 mt-6" 
              disabled={isLoading}
            >
              {isLoading ? "Logging in..." : "Log In"}
            </Button>
          </form>

          <p className="text-center text-sm text-slate-400 mt-6">
            Don't have an account? <Link to="/register" className="text-blue-400 font-semibold hover:underline">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
