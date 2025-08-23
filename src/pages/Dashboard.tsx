import { useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BookOpen, PlusCircle, TrendingUp, FileText } from 'lucide-react';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Welcome to Your Learning Dashboard
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Capture insights, track progress, and analyze your project experiences
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Capture New Lessons */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" 
                onClick={() => navigate('/submit')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <BookOpen className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-xl">Capture New Lessons</CardTitle>
              <CardDescription>
                Document insights and learnings from your projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" size="lg">
                Start Capturing
              </Button>
            </CardContent>
          </Card>

          {/* Submit New Record */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" 
                onClick={() => navigate('/submit')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                <PlusCircle className="h-8 w-8 text-secondary" />
              </div>
              <CardTitle className="text-xl">Submit New Record</CardTitle>
              <CardDescription>
                Add a new project experience to your database
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="secondary" className="w-full" size="lg">
                Add Record
              </Button>
            </CardContent>
          </Card>

          {/* Enter Most Recent Project */}
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group" 
                onClick={() => navigate('/submit')}>
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mb-4 group-hover:bg-accent/20 transition-colors">
                <FileText className="h-8 w-8 text-accent" />
              </div>
              <CardTitle className="text-xl">Enter Your Most Recent Project</CardTitle>
              <CardDescription>
                Quick entry for your latest project experience
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" className="w-full" size="lg">
                Enter Project
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Quick Access Links */}
        <div className="flex justify-center gap-6 mt-12">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/lessons')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View All Lessons
          </Button>
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/analytics')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;