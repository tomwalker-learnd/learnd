import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, TrendingUp, Users, BarChart3 } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && user) {
      navigate('/dashboard');
    }
  }, [user, loading, navigate]);

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-8 w-8 text-primary" />
              <h1 className="text-2xl font-bold">Learnd</h1>
            </div>
            <Button onClick={() => navigate('/auth')}>
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
            Capture & Analyze Your Project Lessons
          </h1>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Turn your project experiences into actionable insights. Track satisfaction, budget performance, 
            and scope changes across all your projects with powerful analytics.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" onClick={() => navigate('/auth')} className="px-8">
              Start Learning Today
            </Button>
            <Button variant="outline" size="lg" className="px-8">
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Why Choose Learnd?</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to capture, organize, and learn from your project experiences
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Easy Capture</CardTitle>
              <CardDescription>
                Quickly record project insights with our intuitive form interface
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <BarChart3 className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Visual Analytics</CardTitle>
              <CardDescription>
                Understand patterns with beautiful charts and filtering capabilities
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="text-center">
            <CardHeader>
              <div className="mx-auto mb-4 p-3 bg-primary/10 rounded-full w-fit">
                <TrendingUp className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Track Progress</CardTitle>
              <CardDescription>
                Monitor satisfaction, budget, and timeline performance over time
              </CardDescription>
            </CardHeader>
          </Card>
        </div>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16">
        <Card className="max-w-2xl mx-auto text-center">
          <CardHeader>
            <CardTitle className="text-2xl">Ready to Start Learning?</CardTitle>
            <CardDescription>
              Join thousands of professionals who are already capturing and analyzing their project lessons
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button size="lg" onClick={() => navigate('/auth')} className="px-8">
              Create Your Account
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/95">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="h-6 w-6 text-primary" />
              <span className="font-semibold">Learnd</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 Learnd. Ready for Stripe subscription integration.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
