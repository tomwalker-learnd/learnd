import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Lesson } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, RefreshCw, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const Analytics = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchLessons();
    }
  }, [user, loading, navigate]);

  const fetchLessons = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('lessons')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons for analytics. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

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

  // Prepare satisfaction distribution data
  const satisfactionData = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: lessons.filter(lesson => lesson.satisfaction === rating).length,
    label: `${rating} Star${rating !== 1 ? 's' : ''}`
  }));

  // Prepare budget status data
  const budgetData = [
    { status: 'Under Budget', count: lessons.filter(lesson => lesson.budget_status === 'under').length, color: '#22c55e' },
    { status: 'On Budget', count: lessons.filter(lesson => lesson.budget_status === 'on').length, color: '#3b82f6' },
    { status: 'Over Budget', count: lessons.filter(lesson => lesson.budget_status === 'over').length, color: '#ef4444' }
  ].filter(item => item.count > 0);

  // Calculate summary statistics
  const totalLessons = lessons.length;
  const avgSatisfaction = totalLessons > 0 ? 
    (lessons.reduce((sum, lesson) => sum + lesson.satisfaction, 0) / totalLessons).toFixed(1) : '0';
  const onBudgetPercentage = totalLessons > 0 ? 
    Math.round((lessons.filter(lesson => lesson.budget_status === 'on').length / totalLessons) * 100) : 0;
  const scopeChangePercentage = totalLessons > 0 ? 
    Math.round((lessons.filter(lesson => lesson.scope_change).length / totalLessons) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Analytics</h1>
              <p className="text-muted-foreground">Insights from your project experiences</p>
            </div>
          </div>
          
          <Button
            variant="outline"
            onClick={fetchLessons}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading analytics...</p>
            </div>
          </div>
        ) : totalLessons === 0 ? (
          <div className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
            <p className="text-muted-foreground mb-6">
              Start by adding some project lessons to see your analytics here.
            </p>
            <Button onClick={() => navigate('/submit')}>
              Add Your First Lesson
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Total Lessons</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{totalLessons}</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Avg Satisfaction</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{avgSatisfaction}/5</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">On Budget</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{onBudgetPercentage}%</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Scope Changes</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary">{scopeChangePercentage}%</div>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Satisfaction Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Satisfaction Distribution</CardTitle>
                  <CardDescription>Distribution of project satisfaction ratings</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={satisfactionData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="label" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} project${value !== 1 ? 's' : ''}`, 'Count']} />
                      <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Budget Status */}
              <Card>
                <CardHeader>
                  <CardTitle>Budget Performance</CardTitle>
                  <CardDescription>Project budget status distribution</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={budgetData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ status, count, percent }) => `${status}: ${count} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {budgetData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} project${value !== 1 ? 's' : ''}`, 'Count']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Additional Insights */}
            <Card>
              <CardHeader>
                <CardTitle>Key Insights</CardTitle>
                <CardDescription>Summary of your project performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold mb-2">Project Health</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Average satisfaction: {avgSatisfaction}/5 stars</li>
                      <li>• {onBudgetPercentage}% of projects stayed on budget</li>
                      <li>• {scopeChangePercentage}% of projects had scope changes</li>
                      <li>• Total projects tracked: {totalLessons}</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Timeline Performance</h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Early: {lessons.filter(l => l.timeline_status === 'early').length} projects</li>
                      <li>• On Time: {lessons.filter(l => l.timeline_status === 'on-time').length} projects</li>
                      <li>• Late: {lessons.filter(l => l.timeline_status === 'late').length} projects</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default Analytics;