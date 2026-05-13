import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AppRole = Database["public"]["Enums"]["app_role"];

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: AppRole | null;
  profile: { full_name: string | null; phone: string | null; avatar_url: string | null } | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [profile, setProfile] = useState<AuthContextType["profile"]>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async (userId: string) => {
    const [rolesRes, profileRes] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", userId).limit(1).maybeSingle(),
      supabase.from("profiles").select("full_name, phone, avatar_url").eq("user_id", userId).maybeSingle(),
    ]);

    return {
      role: rolesRes.data?.role ?? null,
      profile: profileRes.data ?? null,
    };
  };

  useEffect(() => {
    let mounted = true;
    let sessionVersion = 0;

    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;

      const version = ++sessionVersion;
      setLoading(true);
      setSession(nextSession);
      setUser(nextSession?.user ?? null);

      try {
        if (nextSession?.user) {
          const userData = await fetchUserData(nextSession.user.id);
          if (!mounted || version !== sessionVersion) return;
          setRole(userData.role);
          setProfile(userData.profile);
        } else {
          setRole(null);
          setProfile(null);
        }
      } catch {
        if (!mounted || version !== sessionVersion) return;
        setRole(null);
        setProfile(null);
      }

      if (mounted) setLoading(false);
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setTimeout(() => {
          void applySession(nextSession);
        }, 0);
      }
    );

    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      void applySession(currentSession);
    }).catch(() => {
      if (!mounted) return;
      setSession(null);
      setUser(null);
      setRole(null);
      setProfile(null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    setLoading(true);
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setProfile(null);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
