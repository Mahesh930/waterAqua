import { createContext, useContext, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logout, setCredentials } from "../store/authSlice";
import { api } from "@/store/api";
import { toast } from "sonner";

const AuthContext = createContext({
  session: null,
  user: null,
  role: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated } = useSelector((state) => state.auth);
  const [loading, setLoading] = useState(true);

  // Use RTK Query's lazy trigger to fetch me data on start if token exists
  const [triggerGetMe] = api.useLazyGetMeQuery();

  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('aquahome_token');
      const savedUserStr = localStorage.getItem('aquahome_user');

      if (savedToken && savedUserStr) {
        try {
          const savedUser = JSON.parse(savedUserStr);
          // Pre-populate credentials from storage for fast visual loading
          dispatch(setCredentials({ token: savedToken, user: savedUser }));
          
          // Re-fetch latest profile details from our Express server to keep it fresh
          const freshData = await triggerGetMe().unwrap();
          if (freshData && freshData.user) {
            dispatch(setCredentials({ token: savedToken, user: freshData.user }));
          }
        } catch (e) {
          console.warn("[AuthContext] Session revalidation failed:", e?.data?.error || e?.message || e);
          toast.error("Session expired", {
            description: "Your previous session is no longer valid. Please log in again.",
          });
          dispatch(logout());
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, [dispatch, triggerGetMe]);

  const signOut = async () => {
    setLoading(true);
    dispatch(logout());
    // Reset all RTK Query cached data to prevent stale user profiles
    dispatch(api.util.resetApiState());
    setLoading(false);
  };

  // Map user object fields to match existing Supabase types
  const mappedUser = user ? {
    id: user.id || user._id,
    email: user.email,
    pincode: user.pincode,
    address: user.address,
    user_metadata: {
      name: user.name,
      phone: user.phone
    }
  } : null;

  const mappedProfile = user ? {
    full_name: user.name,
    phone: user.phone,
    avatar_url: user.avatarUrl || ""
  } : null;

  return (
    <AuthContext.Provider
      value={{
        session: token ? { access_token: token } : null,
        user: mappedUser,
        role: user ? user.role : null,
        profile: mappedProfile,
        loading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
