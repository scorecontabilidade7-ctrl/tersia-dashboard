import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import {
  supabase,
  getTersiaUserProfile,
  type TersiaProfile,
  type TersiaRole,
} from "@/lib/supabase/client";

type AuthContextValue = {
  user: User | null;
  profile: TersiaProfile | null;
  role: TersiaRole;
  isAdmin: boolean;
  isParticipante: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: TersiaRole,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<TersiaProfile | null>(null);
  const [role, setRole] = useState<TersiaRole>("participante");
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchUserData = useCallback(async (currentUser: User | null) => {
    if (!currentUser) {
      setProfile(null);
      setRole("participante");
      return;
    }
    const { profile: p, role: r } = await getTersiaUserProfile(currentUser.id);
    setProfile(p);
    setRole(r);
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      try {
        const { data } = await supabase.auth.getSession();
        if (!isMounted) return;

        const sessionUser = data.session?.user || null;
        setUser(sessionUser);
        if (sessionUser) {
          await fetchUserData(sessionUser);
        }
      } catch (err) {
        console.error("[AuthProvider] Erro ao obter sessão:", err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    void initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isMounted) return;
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        await fetchUserData(currentUser);
      } else {
        setProfile(null);
        setRole("participante");
      }
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [fetchUserData]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          await fetchUserData(data.user);
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao entrar";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUserData],
  );

  const signUp = useCallback(
    async (
      email: string,
      password: string,
      fullName: string,
      requestedRole: TersiaRole = "participante",
    ) => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              system: "tersia",
              full_name: fullName,
              role: requestedRole,
            },
          },
        });

        if (error) {
          return { success: false, error: error.message };
        }

        if (data.user) {
          setUser(data.user);
          await fetchUserData(data.user);
        }

        return { success: true };
      } catch (err) {
        const message = err instanceof Error ? err.message : "Erro ao registrar usuário";
        return { success: false, error: message };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchUserData],
  );

  const signOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      setUser(null);
      setProfile(null);
      setRole("participante");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      await fetchUserData(user);
    }
  }, [user, fetchUserData]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      profile,
      role,
      isAdmin: role === "admin",
      isParticipante: role === "participante",
      isAuthenticated: !!user,
      isLoading,
      signIn,
      signUp,
      signOut,
      refreshProfile,
    }),
    [user, profile, role, isLoading, signIn, signUp, signOut, refreshProfile],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
