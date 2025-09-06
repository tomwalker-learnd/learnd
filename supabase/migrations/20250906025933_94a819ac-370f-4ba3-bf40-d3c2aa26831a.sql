-- Create organization_settings table
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selected_templates TEXT[] DEFAULT '{}',
  subscription_tier subscription_tier NOT NULL DEFAULT 'free',
  custom_field_limit INTEGER NOT NULL DEFAULT 5,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS on organization_settings
ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Create policies for organization_settings
CREATE POLICY "Users can view their own organization settings" 
ON public.organization_settings 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own organization settings" 
ON public.organization_settings 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own organization settings" 
ON public.organization_settings 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create custom_fields table
CREATE TABLE public.custom_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organization_settings(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'dropdown', 'date', 'boolean')),
  field_options JSONB DEFAULT '{}',
  is_required BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on custom_fields
ALTER TABLE public.custom_fields ENABLE ROW LEVEL SECURITY;

-- Create policies for custom_fields
CREATE POLICY "Users can view their organization's custom fields" 
ON public.custom_fields 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM public.organization_settings os 
  WHERE os.id = organization_id AND os.user_id = auth.uid()
));

CREATE POLICY "Users can insert custom fields for their organization" 
ON public.custom_fields 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM public.organization_settings os 
  WHERE os.id = organization_id AND os.user_id = auth.uid()
));

CREATE POLICY "Users can update their organization's custom fields" 
ON public.custom_fields 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM public.organization_settings os 
  WHERE os.id = organization_id AND os.user_id = auth.uid()
));

CREATE POLICY "Users can delete their organization's custom fields" 
ON public.custom_fields 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM public.organization_settings os 
  WHERE os.id = organization_id AND os.user_id = auth.uid()
));

-- Extend lessons table with new jsonb columns
ALTER TABLE public.lessons 
ADD COLUMN industry_data JSONB DEFAULT '{}',
ADD COLUMN custom_field_data JSONB DEFAULT '{}';

-- Create industry_templates table for predefined field sets
CREATE TABLE public.industry_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL,
  fields JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on industry_templates (public read access)
ALTER TABLE public.industry_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Industry templates are publicly readable" 
ON public.industry_templates 
FOR SELECT 
USING (true);

-- Insert predefined industry templates
INSERT INTO public.industry_templates (name, category, fields, description) VALUES
(
  'financial',
  'Financial Services',
  '{
    "regulatory_compliance": {"type": "number", "label": "Regulatory Compliance Score (1-10)", "required": false},
    "risk_level": {"type": "dropdown", "label": "Risk Level", "options": ["Low", "Medium", "High", "Critical"], "required": false},
    "audit_findings": {"type": "number", "label": "Number of Audit Findings", "required": false}
  }',
  'Fields specific to financial services projects'
),
(
  'technology', 
  'Technology',
  '{
    "technical_debt_hours": {"type": "number", "label": "Technical Debt Hours", "required": false},
    "system_performance_score": {"type": "number", "label": "System Performance Score (1-100)", "required": false},
    "user_adoption_rate": {"type": "number", "label": "User Adoption Rate (%)", "required": false}
  }',
  'Fields specific to technology projects'
),
(
  'consulting',
  'Consulting', 
  '{
    "scope_changes": {"type": "number", "label": "Number of Scope Changes", "required": false},
    "client_engagement_level": {"type": "dropdown", "label": "Client Engagement Level", "options": ["Low", "Medium", "High", "Very High"], "required": false},
    "deliverable_quality": {"type": "number", "label": "Deliverable Quality Score (1-10)", "required": false}
  }',
  'Fields specific to consulting projects'
),
(
  'construction',
  'Construction',
  '{
    "safety_incidents": {"type": "number", "label": "Number of Safety Incidents", "required": false},
    "material_cost_variance": {"type": "number", "label": "Material Cost Variance (%)", "required": false},
    "subcontractor_rating": {"type": "number", "label": "Subcontractor Rating (1-10)", "required": false}
  }',
  'Fields specific to construction projects'
);

-- Create trigger for updated_at on organization_settings
CREATE TRIGGER update_organization_settings_updated_at
BEFORE UPDATE ON public.organization_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create trigger for updated_at on custom_fields
CREATE TRIGGER update_custom_fields_updated_at
BEFORE UPDATE ON public.custom_fields
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();