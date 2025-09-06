import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useUserTier } from '@/hooks/useUserTier';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, ArrowRight, Save, CheckCircle } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { TemplateSelector } from '@/components/forms/TemplateSelector';
import { DynamicFieldRenderer } from '@/components/forms/DynamicFieldRenderer';
import { CustomFieldBuilder } from '@/components/forms/CustomFieldBuilder';
import { FieldGroupToggle } from '@/components/forms/FieldGroupToggle';

interface CustomField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

const ProjectSubmissionWizard = () => {
  const { user, loading } = useAuth();
  const { tier, canAccessCustomDashboards } = useUserTier();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [customFields, setCustomFields] = useState<CustomField[]>([]);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [enabledGroups, setEnabledGroups] = useState<Set<string>>(new Set(['core']));

  const steps = [
    { id: 'templates', label: 'Industry Templates', description: 'Select relevant industry templates' },
    { id: 'custom', label: 'Custom Fields', description: 'Build organization-specific fields' },
    { id: 'configure', label: 'Field Configuration', description: 'Enable/disable field groups' },
    { id: 'form', label: 'Project Details', description: 'Complete your project submission' },
    { id: 'review', label: 'Review & Submit', description: 'Confirm and submit your data' }
  ];

  // Filter steps based on tier
  const availableSteps = steps.filter(step => {
    if (step.id === 'custom' && tier !== 'business' && tier !== 'enterprise') return false;
    if (step.id === 'configure' && tier === 'free') return false;
    return true;
  });

  const progress = ((currentStep + 1) / availableSteps.length) * 100;

  useEffect(() => {
    // Load existing organization settings and custom fields
    if (user) {
      loadOrganizationData();
    }
  }, [user]);

  const loadOrganizationData = async () => {
    try {
      // Load organization settings
      const { data: orgSettings } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('user_id', user?.id)
        .single();

      if (orgSettings) {
        setSelectedTemplates(orgSettings.selected_templates || []);
      }

      // Load custom fields
      if (orgSettings?.id) {
        const { data: fields } = await supabase
          .from('custom_fields')
          .select('*')
          .eq('organization_id', orgSettings.id);

        if (fields) {
          setCustomFields(fields.map(field => {
            const fieldOptions = field.field_options as any;
            return {
              id: field.id,
              label: field.field_name,
              type: field.field_type as CustomField['type'],
              required: field.is_required,
              options: fieldOptions?.options || [],
              description: fieldOptions?.description
            };
          }));
        }
      }
    } catch (error) {
      console.error('Error loading organization data:', error);
    }
  };

  const saveOrganizationSettings = async () => {
    try {
      // Upsert organization settings
      const { data: orgSettings, error: orgError } = await supabase
        .from('organization_settings')
        .upsert({
          user_id: user?.id,
          selected_templates: selectedTemplates,
          subscription_tier: tier
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (orgError) throw orgError;

      // Save custom fields if any
      if (customFields.length > 0 && orgSettings) {
        const fieldsToSave = customFields.map(field => ({
          organization_id: orgSettings.id,
          field_name: field.label,
          field_type: field.type,
          is_required: field.required,
          field_options: {
            placeholder: field.placeholder,
            options: field.options,
            min: field.min,
            max: field.max,
            step: field.step,
            description: field.description
          }
        }));

        const { error: fieldsError } = await supabase
          .from('custom_fields')
          .upsert(fieldsToSave, {
            onConflict: 'organization_id,field_name'
          });

        if (fieldsError) throw fieldsError;
      }

      toast({
        title: "Settings Saved",
        description: "Your organization settings have been saved successfully.",
      });
    } catch (error) {
      console.error('Error saving organization settings:', error);
      toast({
        title: "Error",
        description: "Failed to save organization settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleSubmitProject = async () => {
    setIsSubmitting(true);
    
    try {
      // Validate required fields
      const requiredFields = ['project_name', 'satisfaction', 'budget_status', 'timeline_status'];
      const missingFields = requiredFields.filter(field => !formData[field]);
      
      if (missingFields.length > 0) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields before submitting.",
          variant: "destructive",
        });
        return;
      }

      // Prepare data for submission
      const lessonData = {
        project_name: formData.project_name,
        role: formData.role || 'Project Member',
        client_name: formData.client_name,
        satisfaction: parseInt(formData.satisfaction),
        budget_status: formData.budget_status,
        scope_change: formData.scope_change === 'true',
        timeline_status: formData.timeline_status,
        notes: formData.notes,
        created_by: user?.id,
        
        // Industry-specific data
        industry_data: selectedTemplates.reduce((acc, template) => {
          const templateFields = Object.keys(formData).filter(key => 
            key.startsWith(template) || ['sprint_velocity', 'technical_debt_hours', 'user_engagement_score', 'code_quality_rating', 'deployment_frequency',
                                          'client_satisfaction_score', 'scope_change_frequency', 'stakeholder_engagement_level', 'proposal_win_rate', 'delivery_quality',
                                          'compliance_score', 'risk_level', 'audit_findings_count', 'regulatory_adherence', 'financial_accuracy',
                                          'campaign_roi', 'audience_reach', 'conversion_rate', 'engagement_metrics', 'brand_awareness',
                                          'safety_incidents', 'material_cost_variance', 'timeline_adherence', 'quality_inspections', 'environmental_compliance'].includes(key)
          );
          
          templateFields.forEach(field => {
            if (formData[field] !== undefined && formData[field] !== '') {
              acc[field] = formData[field];
            }
          });
          
          return acc;
        }, {} as Record<string, any>),
        
        // Custom field data
        custom_field_data: customFields.reduce((acc, field) => {
          if (formData[field.id] !== undefined && formData[field.id] !== '') {
            acc[field.id] = formData[field.id];
          }
          return acc;
        }, {} as Record<string, any>)
      };

      const { error } = await supabase
        .from('lessons')
        .insert(lessonData);

      if (error) throw error;

      toast({
        title: "Success!",
        description: "Your project lesson has been submitted successfully.",
      });

      navigate('/projects');
    } catch (error) {
      console.error('Error submitting lesson:', error);
      toast({
        title: "Error",
        description: "Failed to submit lesson. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFieldChange = (fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const handleGroupToggle = (groupId: string, enabled: boolean) => {
    const newEnabledGroups = new Set(enabledGroups);
    if (enabled) {
      newEnabledGroups.add(groupId);
    } else {
      newEnabledGroups.delete(groupId);
    }
    setEnabledGroups(newEnabledGroups);
  };

  const getFieldGroups = () => {
    const groups = [
      {
        id: 'core',
        title: 'Core Project Information',
        description: 'Essential project tracking fields',
        fieldCount: 5,
        enabled: true,
        canToggle: false
      }
    ];

    selectedTemplates.forEach(template => {
      groups.push({
        id: template,
        title: `${template.charAt(0).toUpperCase() + template.slice(1)} Metrics`,
        description: `Industry-specific fields for ${template}`,
        fieldCount: 5, // This would be dynamic based on actual template
        enabled: enabledGroups.has(template),
        canToggle: true
      });
    });

    if (customFields.length > 0) {
      groups.push({
        id: 'custom',
        title: 'Custom Fields',
        description: 'Organization-specific tracking fields',
        fieldCount: customFields.length,
        enabled: enabledGroups.has('custom'),
        canToggle: true
      });
    }

    return groups;
  };

  const canProceed = () => {
    switch (availableSteps[currentStep]?.id) {
      case 'templates':
        return tier === 'free' || selectedTemplates.length > 0;
      case 'custom':
        return true; // Can proceed with or without custom fields
      case 'configure':
        return true;
      case 'form':
        return formData.project_name && formData.satisfaction && formData.budget_status && formData.timeline_status;
      default:
        return true;
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

  const currentStepData = availableSteps[currentStep];

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="space-y-6 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/projects')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Projects
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold">Project Submission Wizard</h1>
                <p className="text-muted-foreground">
                  Configure your organization's project tracking and submit new project data.
                </p>
              </div>

              {/* Progress */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-medium">{currentStepData?.label}</span>
                  <span className="text-muted-foreground">
                    {currentStep + 1} of {availableSteps.length}
                  </span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-sm text-muted-foreground">{currentStepData?.description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <Card className="mb-8">
            <CardContent className="p-6">
              {currentStepData?.id === 'templates' && (
                <TemplateSelector
                  selectedTemplates={selectedTemplates}
                  onTemplatesChange={setSelectedTemplates}
                />
              )}

              {currentStepData?.id === 'custom' && (
                <CustomFieldBuilder
                  customFields={customFields as any}
                  onFieldsChange={setCustomFields as any}
                />
              )}

              {currentStepData?.id === 'configure' && (
                <FieldGroupToggle
                  fieldGroups={getFieldGroups()}
                  onToggle={handleGroupToggle}
                />
              )}

              {currentStepData?.id === 'form' && (
                <DynamicFieldRenderer
                  enabledTemplates={selectedTemplates.filter(template => enabledGroups.has(template))}
                  customFields={enabledGroups.has('custom') ? customFields as any : []}
                  formData={formData}
                  onFieldChange={handleFieldChange}
                  onGroupToggle={handleGroupToggle}
                />
              )}

              {currentStepData?.id === 'review' && (
                <div className="space-y-6">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-16 w-16 text-primary mx-auto" />
                    <h3 className="text-2xl font-bold">Ready to Submit</h3>
                    <p className="text-muted-foreground">
                      Review your project information and submit when ready.
                    </p>
                  </div>

                  {/* Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle>Submission Summary</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium">Project Name:</span>
                          <p className="text-muted-foreground">{formData.project_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Client:</span>
                          <p className="text-muted-foreground">{formData.client_name || 'Not specified'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Satisfaction:</span>
                          <p className="text-muted-foreground">{formData.satisfaction ? `${formData.satisfaction}/5` : 'Not rated'}</p>
                        </div>
                        <div>
                          <span className="font-medium">Budget Status:</span>
                          <p className="text-muted-foreground">{formData.budget_status || 'Not specified'}</p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <span className="font-medium">Active Templates:</span>
                        <div className="flex flex-wrap gap-2">
                          {selectedTemplates.filter(t => enabledGroups.has(t)).map(template => (
                            <span key={template} className="px-2 py-1 bg-primary/10 text-primary rounded text-xs">
                              {template.charAt(0).toUpperCase() + template.slice(1)}
                            </span>
                          ))}
                          {selectedTemplates.filter(t => enabledGroups.has(t)).length === 0 && (
                            <span className="text-muted-foreground text-sm">No templates selected</span>
                          )}
                        </div>
                      </div>

                      {customFields.length > 0 && enabledGroups.has('custom') && (
                        <div className="space-y-2">
                          <span className="font-medium">Custom Fields:</span>
                          <p className="text-muted-foreground text-sm">
                            {customFields.length} custom field{customFields.length !== 1 ? 's' : ''} configured
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => setCurrentStep(prev => Math.max(0, prev - 1))}
              disabled={currentStep === 0}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Previous
            </Button>

            <div className="flex gap-2">
              {currentStep < availableSteps.length - 1 ? (
                <>
                  {(currentStepData?.id === 'templates' || currentStepData?.id === 'custom') && (
                    <Button
                      variant="outline"
                      onClick={saveOrganizationSettings}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </Button>
                  )}
                  <Button
                    onClick={() => setCurrentStep(prev => prev + 1)}
                    disabled={!canProceed()}
                  >
                    Next
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleSubmitProject}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-primary hover:bg-primary/90"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Project'}
                  <CheckCircle className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProjectSubmissionWizard;