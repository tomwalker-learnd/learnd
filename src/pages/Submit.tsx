import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Save } from 'lucide-react';

const Submit = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    project_name: '',
    role: '',
    client_name: '',
    satisfaction: '',
    budget_status: '',
    scope_change: '',
    timeline_status: '',
    notes: ''
  });

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.project_name || !formData.role || !formData.satisfaction || 
        !formData.budget_status || !formData.scope_change || !formData.timeline_status) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const supabaseClient = supabase as any;
      const { error } = await supabaseClient
        .from('lessons')
        .insert({
          project_name: formData.project_name,
          role: formData.role,
          client_name: formData.client_name || null,
          satisfaction: parseInt(formData.satisfaction),
          budget_status: formData.budget_status,
          scope_change: formData.scope_change === 'true',
          timeline_status: formData.timeline_status,
          notes: formData.notes || null,
          created_by: user.id
        });

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your lesson has been saved successfully.",
      });

      navigate('/lessons');
    } catch (error) {
      console.error('Error saving lesson:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Submit New Lesson</CardTitle>
              <CardDescription>
                Capture insights and experiences from your recent project
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Project Name */}
                <div className="space-y-2">
                  <Label htmlFor="project_name">Project Name *</Label>
                  <Input
                    id="project_name"
                    type="text"
                    value={formData.project_name}
                    onChange={(e) => handleInputChange('project_name', e.target.value)}
                    placeholder="Enter project name"
                    required
                  />
                </div>

                {/* Role */}
                <div className="space-y-2">
                  <Label htmlFor="role">Your Role *</Label>
                  <Input
                    id="role"
                    type="text"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    placeholder="e.g., Project Manager, Developer, Designer"
                    required
                  />
                </div>

                {/* Client Name */}
                <div className="space-y-2">
                  <Label htmlFor="client_name">Client Name</Label>
                  <Input
                    id="client_name"
                    type="text"
                    value={formData.client_name}
                    onChange={(e) => handleInputChange('client_name', e.target.value)}
                    placeholder="Enter client or company name"
                  />
                </div>

                {/* Satisfaction Rating */}
                <div className="space-y-2">
                  <Label>Satisfaction Rating *</Label>
                  <RadioGroup 
                    value={formData.satisfaction} 
                    onValueChange={(value) => handleInputChange('satisfaction', value)}
                    className="flex space-x-4"
                  >
                    {[1, 2, 3, 4, 5].map((rating) => (
                      <div key={rating} className="flex items-center space-x-2">
                        <RadioGroupItem value={rating.toString()} id={`satisfaction-${rating}`} />
                        <Label htmlFor={`satisfaction-${rating}`}>{rating}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                  <p className="text-sm text-muted-foreground">1 = Very Unsatisfied, 5 = Very Satisfied</p>
                </div>

                {/* Budget Status */}
                <div className="space-y-2">
                  <Label htmlFor="budget_status">Budget Status *</Label>
                  <Select value={formData.budget_status} onValueChange={(value) => handleInputChange('budget_status', value)}>
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

                {/* Scope Change */}
                <div className="space-y-2">
                  <Label>Scope Changes *</Label>
                  <RadioGroup 
                    value={formData.scope_change} 
                    onValueChange={(value) => handleInputChange('scope_change', value)}
                    className="flex space-x-4"
                  >
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

                {/* Timeline Status */}
                <div className="space-y-2">
                  <Label htmlFor="timeline_status">Timeline Status *</Label>
                  <Select value={formData.timeline_status} onValueChange={(value) => handleInputChange('timeline_status', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeline status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="early">Delivered Early</SelectItem>
                      <SelectItem value="on-time">On Time</SelectItem>
                      <SelectItem value="late">Delivered Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Notes */}
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes & Lessons Learned</Label>
                  <Textarea
                    id="notes"
                    value={formData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    placeholder="Share key insights, challenges overcome, or lessons learned..."
                    rows={4}
                  />
                </div>

                {/* Submit Button */}
                <div className="flex gap-4">
                  <Button type="submit" disabled={isSubmitting} className="flex-1">
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : 'Save Lesson'}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => navigate('/dashboard')}
                    disabled={isSubmitting}
                  >
                    Cancel
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

export default Submit;