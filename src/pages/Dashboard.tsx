import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

const Dashboard = () => {
  const { user, loading, profile } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ totalLessons: 0, avgSatisfaction: '0.0' });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;
      
      try {
        let query = (supabase as any).from('lessons').select('satisfaction');
        
        // If user is not admin or power_user, filter by created_by
        if (profile?.role === 'basic_user') {
          query = query.eq('created_by', user.id);
        }
        
        const { data: lessons } = await query;
        
        if (lessons) {
          const totalLessons = lessons.length;
          const avgSatisfaction = totalLessons > 0 
            ? (lessons.reduce((acc: number, lesson: any) => acc + lesson.satisfaction, 0) / totalLessons).toFixed(1)
            : '0.0';
          
          setStats({ totalLessons, avgSatisfaction });
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    };

    if (user && profile) {
      fetchStats();
    }
  }, [user, profile]);

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

        {/* Primary CTA - Centered on desktop, full-width on mobile */}
        <div className="max-w-md mx-auto mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer group w-full" 
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
        </div>

        {/* Stats Chips - Left aligned under the card */}
        <div className="max-w-md mx-auto mb-8">
          <div className="flex gap-4 text-sm text-muted-foreground">
            <span className="px-3 py-1 bg-muted rounded-full">
              Total Lessons: {stats.totalLessons}
            </span>
            <span className="px-3 py-1 bg-muted rounded-full">
              Avg. Satisfaction: {stats.avgSatisfaction}
            </span>
          </div>
        </div>

        {/* Secondary Links */}
        <div className="flex justify-center gap-6">
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/lessons')}
          >
            <BookOpen className="h-4 w-4 mr-2" />
            View Lessons
          </Button>
          <Button 
            variant="ghost" 
            className="text-muted-foreground hover:text-foreground"
            onClick={() => navigate('/analytics')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            View Analytics
          </Button>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;