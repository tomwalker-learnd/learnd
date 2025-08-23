import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Client } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft } from 'lucide-react';

const LessonForm = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (user) {
      fetchClients();
    }
  }, [user]);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    
    const formData = new FormData(e.currentTarget);
    const lessonData = {
      user_id: user.id,
      project_name: formData.get('projectName') as string,
      role: formData.get('role') as string,
      client_id: formData.get('clientId') === 'none' ? null : formData.get('clientId') as string,
      satisfaction_rating: parseInt(formData.get('satisfactionRating') as string),
      budget_status: formData.get('budgetStatus') as 'under' | 'on' | 'over',
      scope_changes: formData.get('scopeChanges') === 'true',
      timeline_status: formData.get('timelineStatus') as 'early' | 'on_time' | 'delayed',
      notes: formData.get('notes') as string || null,
    };

    try {
      const { error } = await supabase
        .from('lessons')
        .insert([lessonData]);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your lesson has been captured successfully.",
      });

      navigate('/dashboard');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save your lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
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
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Capture New Lesson</h1>
              <p className="text-muted-foreground">Record insights from your latest project experience</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Project Lesson Details</CardTitle>
              <CardDescription>
                Share your experience and insights from this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="projectName">Project Name *</Label>
                  <Input
                    id="projectName"
                    name="projectName"
                    required
                    placeholder="e.g., Website Redesign 2024"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Your Role *</Label>
                  <Input
                    id="role"
                    name="role"
                    required
                    placeholder="e.g., Project Manager, Developer, Designer"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="clientId">Client</Label>
                  <Select name="clientId" defaultValue="none">
                    <SelectTrigger>
                      <SelectValue placeholder="Select a client" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No specific client</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Satisfaction Rating *</Label>
                  <RadioGroup name="satisfactionRating" required className="flex gap-4">
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`rating-${rating}`} />
                        <Label htmlFor={`rating-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="budgetStatus">Budget Status *</Label>
                  <Select name="budgetStatus" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select budget status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="under">Under Budget</SelectItem>
                      <SelectItem value="on">On Budget</SelectItem>
                      <SelectItem value="over">Over Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Scope Changes *</Label>
                  <RadioGroup name="scopeChanges" required className="flex gap-4">
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="true" id="scope-yes" />
                      <Label htmlFor="scope-yes">Yes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="false" id="scope-no" />
                      <Label htmlFor="scope-no">No</Label>
                    </div>
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timelineStatus">Timeline Status *</Label>
                  <Select name="timelineStatus" required>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early">Delivered Early</SelectItem>
                      <SelectItem value="on_time">On Time</SelectItem>
                      <SelectItem value="delayed">Delayed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes & Lessons Learned</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Share key insights, challenges, what worked well, what could be improved..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    {isSubmitting ? "Saving..." : "Save Lesson"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default LessonForm;