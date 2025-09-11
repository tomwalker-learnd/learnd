// src/hooks/useAuth.tsx
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import type { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import type { Profile } from "@/types";

type AuthContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => Promise<{ error: any }>;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<{ error: any }>;
};

const AuthContext = createContext<AuthContextType | null>(null);

function useMountedRef() {
  const ref = useRef(true);
  useEffect(() => {
    ref.current = true;
    return () => {
      ref.current = false;
    };
  }, []);
  return ref;
}

async function loadProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle();
  if (error) {
    // eslint-disable-next-line no-console
    console.warn("[auth] profile load error:", error.message);
    return null;
  }
  return (data as unknown as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const mounted = useMountedRef();
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initial session load + subscription
  useEffect(() => {
    let unsub: (() => void) | null = null;

    const init = async () => {
      try {
        console.log('[DEBUG] Auth init starting...');
        setLoading(true);
        // 1) Get current session
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;

        const sess = data.session ?? null;
        const usr = sess?.user ?? null;
        console.log('[DEBUG] Session loaded:', { hasSession: !!sess, hasUser: !!usr, userId: usr?.id });

        if (!mounted.current) return;
        setSession(sess);
        setUser(usr);

        // 2) Load profile if we have a user
        if (usr) {
          console.log('[DEBUG] Loading profile for user:', usr.id);
          const p = await loadProfile(usr.id);
          if (!mounted.current) return;
          setProfile(p);
          console.log('[DEBUG] Profile loaded:', !!p);
        } else {
          setProfile(null);
        }

        // 3) Subscribe to auth changes
        const { data: sub } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            console.log('[DEBUG] Auth state change:', event, { hasSession: !!newSession, userId: newSession?.user?.id });
            if (!mounted.current) return;
            setSession(newSession ?? null);
            const newUser = newSession?.user ?? null;
            setUser(newUser);

            if (newUser) {
              const p = await loadProfile(newUser.id);
              if (!mounted.current) return;
              setProfile(p);

              // Start onboarding for new users after email verification
              console.log('[DEBUG] Auth state change processing:', { 
                event, 
                hasUser: !!newUser,
                userId: newUser?.id,
                email: newUser?.email
              });
              
              if (event === 'SIGNED_IN' && !localStorage.getItem('onboarding_completed')) {
                console.log('[DEBUG] Onboarding check for user:', { 
                  userId: newUser.id, 
                  email: newUser.email,
                  onboardingCompleted: localStorage.getItem('onboarding_completed')
                });
                
                console.log('[DEBUG] User needs onboarding, redirecting to homepage');
                // Redirect to homepage which will show welcome screen
                setTimeout(() => {
                  console.log('[DEBUG] Redirecting to homepage for onboarding');
                  window.location.href = '/';
                }, 100);
              } else {
                console.log('[DEBUG] Onboarding conditions not met:', {
                  isSignedIn: event === 'SIGNED_IN',
                  onboardingCompleted: localStorage.getItem('onboarding_completed')
                });
              }
            } else {
              setProfile(null);
            }
          }
        );
        unsub = () => sub.subscription.unsubscribe();
      } catch (e: any) {
        // eslint-disable-next-line no-console
        console.warn("[auth] init error:", e?.message || e);
      } finally {
        console.log('[DEBUG] Auth init complete, setting loading to false');
        if (mounted.current) setLoading(false);
      }
    };

    init();
    return () => {
      if (unsub) unsub();
    };
  }, [mounted]);

  // Public methods
  const signUp = async (
    email: string,
    password: string,
    firstName?: string,
    lastName?: string
  ) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          first_name: firstName ?? null,
          last_name: lastName ?? null,
        },
      },
    });
    return { error };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
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
