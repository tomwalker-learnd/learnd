// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@/types";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName?: string, lastName?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load current session first, then subscribe to changes
  useEffect(() => {
    let mounted = true;

    async function prime() {
      try {
        setLoading(true);
        const { data } = await supabase.auth.getSession();
        const currSession = data?.session ?? null;
        const currUser = currSession?.user ?? null;

        if (!mounted) return;
        setSession(currSession);
        setUser(currUser);

        if (currUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currUser.id)
            .maybeSingle();

          if (!mounted) return;
          setProfile(
            profileData ?? {
              id: currUser.id,
              email: currUser.email,
              first_name: currUser.user_metadata?.first_name ?? null,
              last_name: currUser.user_metadata?.last_name ?? null,
              role: (currUser.app_metadata as any)?.role ?? null,
            }
          );
        } else {
          setProfile(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    prime();

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, nextSession) => {
      const nextUser = nextSession?.user ?? null;
      setSession(nextSession ?? null);
      setUser(nextUser);

      if (nextUser) {
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", nextUser.id)
          .maybeSingle();

        setProfile(
          profileData ?? {
            id: nextUser.id,
            email: nextUser.email,
            first_name: nextUser.user_metadata?.first_name ?? null,
            last_name: nextUser.user_metadata?.last_name ?? null,
            role: (nextUser.app_metadata as any)?.role ?? null,
          }
        );
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub?.subscription?.unsubscribe?.();
    };
  }, []);

  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName, last_name: lastName },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error };
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    return { error };
  };

  const value = useMemo<AuthContextType>(
    () => ({ user, session, profile, loading, signUp, signIn, signOut }),
    [user, session, profile, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
