// src/hooks/useAuth.tsx
import { createContext, useContext, useEffect, useMemo, useRef, useState, ReactNode } from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

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

// Small helper to guarantee we stop "loading" even if Supabase hangs
const raceWithTimeout = <T,>(p: Promise<T>, ms = 3500, label = "getSession") =>
  Promise.race<T | { __timeout: true }>([
    p,
    new Promise((resolve) => setTimeout(() => resolve({ __timeout: true } as any), ms)),
  ]).then((r) => {
    if ((r as any)?.__timeout) {
      // eslint-disable-next-line no-console
      console.warn(`[auth] ${label} timed out after ${ms}ms`);
    }
    return r as T;
  });

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    const prime = async () => {
      try {
        setLoading(true);
        // 1) Load current session with a timeout fallback
        const sess = await raceWithTimeout(supabase.auth.getSession(), 3500, "getSession");
        const currSession = (sess as any)?.data?.session ?? null;
        const currUser = currSession?.user ?? null;

        if (!mountedRef.current) return;
        setSession(currSession);
        setUser(currUser);

        // 2) Load profile (best-effort)
        if (currUser) {
          try {
            const { data: profileData, error } = await supabase
              .from("profiles")
              .select("*")
              .eq("id", currUser.id)
              .maybeSingle();

            if (!mountedRef.current) return;
            if (error) {
              // eslint-disable-next-line no-console
              console.warn("[auth] profile load error:", error.message);
            }

            setProfile(
              profileData ?? {
                id: currUser.id,
                email: currUser.email,
                first_name: currUser.user_metadata?.first_name ?? null,
                last_name: currUser.user_metadata?.last_name ?? null,
                role: (currUser.app_metadata as any)?.role ?? null,
              }
            );
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn("[auth] profile load threw:", e);
            if (mountedRef.current) setProfile(null);
          }
        } else {
          setProfile(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error("[auth] prime() failed:", e);
      } finally {
        if (mountedRef.current) setLoading(false);
      }
    };

    prime();

    // 3) Subscribe to auth changes (with safety)
    const { data: sub } = supabase.auth.onAuthStateChange(async (_evt, nextSession) => {
      try {
        const nextUser = nextSession?.user ?? null;
        if (mountedRef.current) {
          setSession(nextSession ?? null);
          setUser(nextUser);
        }

        if (nextUser) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", nextUser.id)
            .maybeSingle();

          if (mountedRef.current) {
            setProfile(
              profileData ?? {
                id: nextUser.id,
                email: nextUser.email,
                first_name: nextUser.user_metadata?.first_name ?? null,
                last_name: nextUser.user_metadata?.last_name ?? null,
                role: (nextUser.app_metadata as any)?.role ?? null,
              }
            );
          }
        } else if (mountedRef.current) {
          setProfile(null);
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.warn("[auth] onAuthStateChange handler error:", e);
      }
    });

    return () => {
      mountedRef.current = false;
      try {
        sub?.subscription?.unsubscribe?.();
      } catch {
        /* no-op */
      }
    };
  }, []);

  // API
  const signUp = async (email: string, password: string, firstName?: string, lastName?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { first_name: firstName ?? null, last_name: lastName ?? null },
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
