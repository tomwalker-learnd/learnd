import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const ResetPassword = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  // Try to ensure we have a session after redirect (token in the hash)
  useEffect(() => {
    const run = async () => {
      try {
        // If the URL is like /auth/reset#access_token=...&type=recovery
        const hash = window.location.hash;
        const hasAccessToken = /access_token=/.test(hash);

        // If we don't already have a session, try to exchange the token in the hash
        const { data: sess } = await supabase.auth.getSession();

        if (!sess.session && hasAccessToken) {
          const { error } = await supabase.auth.exchangeCodeForSession(hash);
          if (error) throw error;
        }

        // At this point, we should have a valid session for updateUser
        setSessionReady(true);
      } catch (err: any) {
        toast({
          title: "Link problem",
          description: err?.message ?? "We couldn't validate your reset link.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [toast]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({
        title: "Password too short",
        description: "Please use at least 6 characters.",
        variant: "destructive",
      });
      return;
    }
    if (password !== confirm) {
      toast({
        title: "Passwords don't match",
        description: "Please re-enter your password.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;

      toast({
        title: "Password updated",
        description: "You can now sign in with your new password.",
      });

      navigate("/auth", { replace: true });
    } catch (err: any) {
      toast({
        title: "Couldn't update password",
        description: err?.message ?? "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader>
            <CardTitle>Set a new password</CardTitle>
          </CardHeader>
          <CardContent>
            {!sessionReady ? (
              <p className="text-muted-foreground">
                {loading
                  ? "Validating your reset link…"
                  : "We couldn't validate your reset link."}
              </p>
            ) : (
              <form onSubmit={handleUpdate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="password">New password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm">Confirm new password</Label>
                  <Input
                    id="confirm"
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Saving…" : "Save new password"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
