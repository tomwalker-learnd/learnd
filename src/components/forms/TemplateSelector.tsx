import { useState } from 'react';
import { useUserTier } from '@/hooks/useUserTier';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lock, Check } from 'lucide-react';

interface IndustryTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  fields: string[];
  icon: string;
}

const industryTemplates: IndustryTemplate[] = [
  {
    id: 'technology',
    name: 'Technology',
    description: 'Sprint performance, technical debt, user metrics',
    category: 'Technology',
    fields: ['sprint_velocity', 'technical_debt_hours', 'user_engagement_score', 'code_quality_rating', 'deployment_frequency'],
    icon: '💻'
  },
  {
    id: 'consulting',
    name: 'Consulting',
    description: 'Client satisfaction, scope changes, stakeholder engagement',
    category: 'Professional Services',
    fields: ['client_satisfaction_score', 'scope_change_frequency', 'stakeholder_engagement_level', 'proposal_win_rate', 'delivery_quality'],
    icon: '📊'
  },
  {
    id: 'financial',
    name: 'Financial Services',
    description: 'Compliance status, risk assessment, audit results',
    category: 'Finance',
    fields: ['compliance_score', 'risk_level', 'audit_findings_count', 'regulatory_adherence', 'financial_accuracy'],
    icon: '💰'
  },
  {
    id: 'marketing',
    name: 'Marketing',
    description: 'Campaign ROI, audience reach, conversion metrics',
    category: 'Marketing',
    fields: ['campaign_roi', 'audience_reach', 'conversion_rate', 'engagement_metrics', 'brand_awareness'],
    icon: '📈'
  },
  {
    id: 'construction',
    name: 'Construction',
    description: 'Safety records, material costs, timeline adherence',
    category: 'Construction',
    fields: ['safety_incidents', 'material_cost_variance', 'timeline_adherence', 'quality_inspections', 'environmental_compliance'],
    icon: '🏗️'
  }
];

interface TemplateSelectorProps {
  selectedTemplates: string[];
  onTemplatesChange: (templates: string[]) => void;
}

export function TemplateSelector({ selectedTemplates, onTemplatesChange }: TemplateSelectorProps) {
  const { tier, canAccessCustomDashboards } = useUserTier();
  
  const getMaxSelections = () => {
    switch (tier) {
      case 'free': return 0;
      case 'team': return 2;
      case 'business':
      case 'enterprise': return industryTemplates.length;
      default: return 0;
    }
  };

  const maxSelections = getMaxSelections();
  const canSelectMore = selectedTemplates.length < maxSelections;

  const handleTemplateToggle = (templateId: string) => {
    const isSelected = selectedTemplates.includes(templateId);
    
    if (isSelected) {
      onTemplatesChange(selectedTemplates.filter(id => id !== templateId));
    } else if (canSelectMore) {
      onTemplatesChange([...selectedTemplates, templateId]);
    }
  };

  const getTemplateStatus = (templateId: string) => {
    const isSelected = selectedTemplates.includes(templateId);
    const canSelect = tier !== 'free' && (isSelected || canSelectMore);
    
    return { isSelected, canSelect };
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Industry Templates</h3>
        <p className="text-sm text-muted-foreground">
          Choose industry-specific field templates to customize your project tracking.
        </p>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">
            {tier === 'free' ? 'Free Tier' : `${tier} Tier`}
          </Badge>
          <span className="text-sm text-muted-foreground">
            {tier === 'free' ? 'Upgrade to access templates' : `${selectedTemplates.length}/${maxSelections} selected`}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {industryTemplates.map((template) => {
          const { isSelected, canSelect } = getTemplateStatus(template.id);
          
          return (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all ${
                isSelected ? 'ring-2 ring-primary border-primary' : 
                canSelect ? 'hover:border-primary/50' : 'opacity-60'
              }`}
              onClick={() => canSelect && handleTemplateToggle(template.id)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{template.icon}</span>
                    <CardTitle className="text-base">{template.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-2">
                    {!canSelect && tier === 'free' && (
                      <Lock className="h-4 w-4 text-muted-foreground" />
                    )}
                    {canSelect && (
                      <Checkbox 
                        checked={isSelected}
                        className="data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                      />
                    )}
                    {isSelected && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                </div>
                <CardDescription className="text-sm">
                  {template.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Sample Fields:</p>
                  <div className="flex flex-wrap gap-1">
                    {template.fields.slice(0, 3).map((field) => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field.replace(/_/g, ' ')}
                      </Badge>
                    ))}
                    {template.fields.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{template.fields.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {tier === 'free' && (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Lock className="h-5 w-5 text-destructive" />
              <div>
                <p className="font-medium">Upgrade to Access Industry Templates</p>
                <p className="text-sm text-muted-foreground">
                  Team tier and above can select industry-specific field templates.
                </p>
              </div>
              <Button variant="destructive" size="sm" className="ml-auto">
                Upgrade
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}