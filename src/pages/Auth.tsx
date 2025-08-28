import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import logo from "@/assets/learnd-logo.png";

type Mode = "signin" | "signup";

// Official tagline
const TAGLINE = "Learn. Improve. Repeat.";

export default function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user) navigate("/");
  }, [loading, user, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
      }
    } catch (e: any) {
      setError(e?.message ?? "Authentication failed.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Checking session…</div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;

  return (
    <div className="min-h-screen flex items-start justify-center px-4">
      <div className="w-full max-w-sm pt-20 md:pt-28 pb-10">
        {/* Bigger, lower logo + tagline */}
        <div className="mb-6 flex flex-col items-center">
          <img src={logo} alt="Learnd" className="h-20 w-auto md:h-24" />
          <p className="mt-2 text-sm text-muted-foreground text-center">
            {TAGLINE}
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-center">
              {mode === "signin" ? "Welcome back" : "Create your account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={onSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              {/* Gradient primary CTA */}
              <Button type="submit" className="w-full" variant="gradient" disabled={submitting}>
                {submitting ? "Working…" : mode === "signin" ? "Sign in" : "Create account"}
              </Button>
            </form>

            <div className="mt-4 text-sm text-center text-muted-foreground">
              {mode === "signin" ? (
                <>
                  Don’t have an account?{" "}
                  <button className="underline" onClick={() => setMode("signup")} type="button">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button className="underline" onClick={() => setMode("signin")} type="button">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
