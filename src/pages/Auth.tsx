import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client'; // ← added

function useIsDark(): boolean {
  const getIsDark = () =>
    document.documentElement.classList.contains('dark') ||
    window.matchMedia?.('(prefers-color-scheme: dark)').matches;

  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      return getIsDark();
    } catch {
      return false;
    }
  });

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const onMQ = () => setIsDark(getIsDark());
    mq?.addEventListener?.('change', onMQ);

    const obs = new MutationObserver(() => setIsDark(getIsDark()));
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });

    return () => {
      mq?.removeEventListener?.('change', onMQ);
      obs.disconnect();
    };
  }, []);

  return isDark;
}

const Auth = () => {
  const { user, signIn, signUp, loading } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isDark = useIsDark();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);

    if (error) {
      setError(error.message);
    } else {
      toast({
        title: 'Welcome back!',
        description: 'You have successfully signed in.',
      });
    }

    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;

    const { error } = await signUp(email, password, firstName, lastName);

    if (error) {
      setError(error.message);
    } else {
      toast({
        title: 'Account created!',
        description: 'Please check your email to verify your account.',
      });
    }

    setIsLoading(false);
  };

  // --- NEW: Forgot password handler
  const handleForgotPassword = async () => {
    const emailEl = document.getElementById('email') as HTMLInputElement | null;
    const email = emailEl?.value?.trim();

    if (!email) {
      toast({
        title: 'Enter your email',
        description:
          'Type your account email in the Email field, then click “Forgot your password?” again.',
        variant: 'destructive',
      });
      return;
    }

    const redirectTo = `${window.location.origin}/auth/reset`;

    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) {
      toast({
        title: 'Couldn’t send reset link',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Check your email',
      description: 'We sent you a password reset link.',
    });
  };
  // --- end NEW

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-6">
          <img
            src={isDark ? '/brand/learnd-logo-v8_Lgt.png' : '/brand/learnd-logo-v8_Lgt.png'}
            alt="Learnd"
            className="mx-auto w-auto"
            style={{ height: '90px', maxHeight: '20vh' }}
          />
          <p className="mt-2 text-center text-sm sm:text-base text-muted-foreground">
            Learn. Improve. Repeat.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>Sign in to your account or create a new one</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="signin" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>

              {error && (
                <Alert variant="destructive" className="mt-4">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <TabsContent value="signin">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" name="password" type="password" required />
                  </div>

                  {/* NEW: Forgot password link */}
                  <p className="text-right -mt-2">
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-brand hover:underline text-sm"
                    >
                      Forgot your password?
                    </button>
                  </p>

                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input id="firstName" name="firstName" type="text" placeholder="John" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input id="lastName" name="lastName" type="text" placeholder="Doe" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input
                      id="signup-email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input
                      id="signup-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? 'Creating account...' : 'Create Account'}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
