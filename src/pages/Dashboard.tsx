import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Lesson, LessonFilters, Client } from '@/types';
import { SummaryPanel } from '@/components/dashboard/SummaryPanel';
import { LessonsList } from '@/components/dashboard/LessonsList';
import { ChartsView } from '@/components/dashboard/ChartsView';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';

const Dashboard = () => {
  const { user, profile, loading } = useAuth();
  const { toast } = useToast();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [filters, setFilters] = useState<LessonFilters>({});
  const [lessonsLoading, setLessonsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchLessons();
      fetchClients();
    }
  }, [user]);

  const fetchLessons = async () => {
    if (!user) return;
    
    setLessonsLoading(true);
    try {
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          *,
          client:clients(*)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch lessons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLessonsLoading(false);
    }
  };

  const fetchClients = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('user_id', user.id)
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

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

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader profile={profile} />
      
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <SummaryPanel lessons={lessons} />
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <LessonsList 
                lessons={lessons} 
                clients={clients}
                filters={filters}
                onFiltersChange={setFilters}
                loading={lessonsLoading}
                onRefresh={fetchLessons}
              />
            </div>
            
            <div className="lg:col-span-1">
              <ChartsView lessons={lessons} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;