import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Droplets, LogOut, Menu, X, Bell, Moon, Sun } from "lucide-react";
import { Button } from "@/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useGetNotificationsQuery, useMarkNotificationsReadMutation } from "@/store/api";
import { motion, AnimatePresence } from "framer-motion";

function useTheme() {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return { dark, toggle: () => setDark(d => !d) };
}

function NotificationPanel({ notifications = [], markAllRead }) {
  useEffect(() => {
    markAllRead();
  }, [markAllRead]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }} 
      animate={{ opacity: 1, y: 0 }} 
      exit={{ opacity: 0, y: -10 }}
      className="absolute right-0 top-full mt-2 w-80 bg-[#0e142e] border border-white/5 rounded-2xl shadow-2xl overflow-hidden z-50 text-slate-200"
    >
      <div className="p-3 border-b border-white/5 bg-[#0a0f24]">
        <h4 className="font-semibold text-sm">Notifications</h4>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-8">No notifications yet</p>
        ) : (
          notifications.map((n) => (
            <div key={n.id || n._id} className={`p-3 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors ${!n.read ? "bg-blue-500/10" : ""}`}>
              <p className="text-sm font-semibold text-white">{n.title}</p>
              <p className="text-xs text-slate-400 mt-0.5">{n.message}</p>
              <p className="text-[10px] text-slate-500 mt-1">
                {new Date(n.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}

export default function DashboardLayout({ children, navItems, title }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, profile, user } = useAuth();
  const { dark, toggle } = useTheme();

  // RTK Query hooks for notifications (with 10 seconds auto-polling)
  const { data: notifications = [] } = useGetNotificationsQuery(undefined, {
    skip: !user,
    pollingInterval: 10000
  });
  
  const [markNotificationsRead] = useMarkNotificationsReadMutation();

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-[#070b19] text-slate-100">
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-[#070b19]/80 border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-500 to-sky-400 flex items-center justify-center shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-300">
                <Droplets className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-wide bg-gradient-to-r from-white to-blue-200 bg-clip-text text-transparent">
                {title}
              </span>
            </Link>

            <div className="hidden md:flex items-center gap-1.5">
              {navItems.map(item => {
                const active = location.pathname === item.path;
                return (
                  <Link 
                    key={item.path} 
                    to={item.path}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      active 
                        ? "bg-blue-600/10 text-blue-400 border border-blue-500/15" 
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    {item.icon}{item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex items-center gap-2.5">
              {/* Theme toggle */}
              <Button variant="ghost" size="icon" onClick={toggle} className="relative h-9 w-9 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl">
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>

              {/* Notification bell */}
              <div className="relative">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative h-9 w-9 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl" 
                  onClick={() => setNotifOpen(!notifOpen)}
                >
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center animate-bounce">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </Button>
                <AnimatePresence>
                  {notifOpen && user && (
                    <NotificationPanel 
                      notifications={notifications} 
                      markAllRead={markNotificationsRead} 
                    />
                  )}
                </AnimatePresence>
              </div>

              {profile?.full_name && (
                <span className="hidden sm:block text-xs font-semibold text-slate-400 max-w-[100px] truncate bg-[#0f1430] border border-white/5 px-3 py-1.5 rounded-lg">
                  {profile.full_name}
                </span>
              )}
              
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout} 
                className="gap-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl"
              >
                <LogOut className="h-4 w-4" /> 
                <span className="hidden sm:inline text-xs font-semibold">Log Out</span>
              </Button>
              
              <Button 
                variant="ghost" 
                size="icon" 
                className="md:hidden h-9 w-9 text-slate-300 hover:text-white" 
                onClick={() => setMobileOpen(!mobileOpen)}
              >
                {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {mobileOpen && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }} 
              animate={{ opacity: 1, height: "auto" }} 
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/5 overflow-hidden bg-[#070b19]"
            >
              <div className="p-3 space-y-1">
                {navItems.map(item => {
                  const active = location.pathname === item.path;
                  return (
                    <Link 
                      key={item.path} 
                      to={item.path} 
                      onClick={() => setMobileOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-colors ${
                        active 
                          ? "bg-blue-600/10 text-blue-400 border border-blue-500/10" 
                          : "text-slate-400 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      {item.icon}{item.label}
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-7xl mx-auto">{children}</main>

      {notifOpen && <div className="fixed inset-0 z-40" onClick={() => setNotifOpen(false)} />}
    </div>
  );
}
