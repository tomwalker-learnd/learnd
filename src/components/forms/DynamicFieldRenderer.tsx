import React, { useState, Suspense } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { DynamicFormFields } from './DynamicFormFields';
import { ProjectLifecycleStatus } from '@/lib/statusUtils';
import { IntelligentClientInput } from '@/components/forms/IntelligentClientInput';

interface FieldConfig {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating' | 'slider';
  required?: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: any;
  description?: string;
}

interface FieldGroup {
  id: string;
  title: string;
  description?: string;
  fields: FieldConfig[];
  template?: string;
  enabled: boolean;
}

const coreFields: FieldConfig[] = [
  {
    id: 'project_name',
    label: 'Project Name',
    type: 'text',
    required: true,
    placeholder: 'Enter project name'
  },
  {
    id: 'client_name',
    label: 'Client Name',
    type: 'text',
    placeholder: 'Enter client or company name'
  },
  {
    id: 'project_status',
    label: 'Project Status',
    type: 'select',
    required: true,
    options: ['active', 'on_hold', 'completed', 'cancelled'],
    placeholder: 'Select project status',
    description: 'Current lifecycle stage of the project'
  },
  {
    id: 'satisfaction',
    label: 'Overall Satisfaction',
    type: 'rating',
    required: true,
    min: 1,
    max: 5,
    description: '1 = Very Unsatisfied, 5 = Very Satisfied'
  },
  {
    id: 'budget_status',
    label: 'Budget Status',
    type: 'select',
    required: true,
    options: ['under', 'on', 'over'],
    placeholder: 'Select budget status'
  },
  {
    id: 'timeline_status',
    label: 'Timeline Status',
    type: 'select',
    required: true,
    options: ['early', 'on-time', 'late'],
    placeholder: 'Select timeline status'
  }
];

const templateFieldGroups: Record<string, FieldGroup> = {
  technology: {
    id: 'technology',
    title: 'Technology Metrics',
    description: 'Development and technical performance indicators',
    enabled: true,
    template: 'technology',
    fields: [
      {
        id: 'sprint_velocity',
        label: 'Sprint Velocity',
        type: 'number',
        placeholder: 'Story points completed',
        min: 0
      },
      {
        id: 'technical_debt_hours',
        label: 'Technical Debt (Hours)',
        type: 'number',
        placeholder: 'Hours spent on technical debt',
        min: 0
      },
      {
        id: 'user_engagement_score',
        label: 'User Engagement Score',
        type: 'rating',
        min: 1,
        max: 10,
        description: 'Rate user engagement with the delivered features'
      },
      {
        id: 'code_quality_rating',
        label: 'Code Quality Rating',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Overall code quality assessment'
      },
      {
        id: 'deployment_frequency',
        label: 'Deployment Frequency',
        type: 'select',
        options: ['daily', 'weekly', 'monthly', 'quarterly'],
        placeholder: 'How often were deployments made?'
      }
    ]
  },
  consulting: {
    id: 'consulting',
    title: 'Consulting Metrics',
    description: 'Client relationship and service delivery metrics',
    enabled: true,
    template: 'consulting',
    fields: [
      {
        id: 'client_satisfaction_score',
        label: 'Client Satisfaction Score',
        type: 'rating',
        min: 1,
        max: 10,
        description: 'Client feedback and satisfaction rating'
      },
      {
        id: 'scope_change_frequency',
        label: 'Scope Change Frequency',
        type: 'number',
        placeholder: 'Number of scope changes',
        min: 0
      },
      {
        id: 'stakeholder_engagement_level',
        label: 'Stakeholder Engagement',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Level of stakeholder participation and engagement'
      },
      {
        id: 'proposal_win_rate',
        label: 'Proposal Win Rate',
        type: 'slider',
        min: 0,
        max: 100,
        step: 5,
        description: 'Percentage of proposals won during this period'
      },
      {
        id: 'delivery_quality',
        label: 'Delivery Quality',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Quality of final deliverables'
      }
    ]
  },
  financial: {
    id: 'financial',
    title: 'Financial Compliance',
    description: 'Regulatory and compliance tracking',
    enabled: true,
    template: 'financial',
    fields: [
      {
        id: 'compliance_score',
        label: 'Compliance Score',
        type: 'rating',
        min: 1,
        max: 10,
        description: 'Overall regulatory compliance rating'
      },
      {
        id: 'risk_level',
        label: 'Risk Level',
        type: 'select',
        options: ['low', 'medium', 'high', 'critical'],
        placeholder: 'Assess project risk level'
      },
      {
        id: 'audit_findings_count',
        label: 'Audit Findings',
        type: 'number',
        placeholder: 'Number of audit findings',
        min: 0
      },
      {
        id: 'regulatory_adherence',
        label: 'Regulatory Adherence',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Adherence to regulatory requirements'
      },
      {
        id: 'financial_accuracy',
        label: 'Financial Accuracy',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Accuracy of financial reporting and calculations'
      }
    ]
  },
  marketing: {
    id: 'marketing',
    title: 'Marketing Performance',
    description: 'Campaign effectiveness and ROI metrics',
    enabled: true,
    template: 'marketing',
    fields: [
      {
        id: 'campaign_roi',
        label: 'Campaign ROI (%)',
        type: 'number',
        placeholder: 'Return on investment percentage',
        step: 0.1
      },
      {
        id: 'audience_reach',
        label: 'Audience Reach',
        type: 'number',
        placeholder: 'Number of people reached',
        min: 0
      },
      {
        id: 'conversion_rate',
        label: 'Conversion Rate (%)',
        type: 'slider',
        min: 0,
        max: 100,
        step: 0.1,
        description: 'Percentage of audience that converted'
      },
      {
        id: 'engagement_metrics',
        label: 'Engagement Score',
        type: 'rating',
        min: 1,
        max: 10,
        description: 'Social media and content engagement level'
      },
      {
        id: 'brand_awareness',
        label: 'Brand Awareness Impact',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Impact on brand recognition and awareness'
      }
    ]
  },
  construction: {
    id: 'construction',
    title: 'Construction Metrics',
    description: 'Safety, cost, and timeline tracking',
    enabled: true,
    template: 'construction',
    fields: [
      {
        id: 'safety_incidents',
        label: 'Safety Incidents',
        type: 'number',
        placeholder: 'Number of safety incidents',
        min: 0
      },
      {
        id: 'material_cost_variance',
        label: 'Material Cost Variance (%)',
        type: 'slider',
        min: -50,
        max: 50,
        step: 1,
        description: 'Percentage over/under material cost budget'
      },
      {
        id: 'timeline_adherence',
        label: 'Timeline Adherence',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'How well the project stayed on schedule'
      },
      {
        id: 'quality_inspections',
        label: 'Quality Inspection Score',
        type: 'rating',
        min: 1,
        max: 10,
        description: 'Average quality inspection ratings'
      },
      {
        id: 'environmental_compliance',
        label: 'Environmental Compliance',
        type: 'rating',
        min: 1,
        max: 5,
        description: 'Adherence to environmental regulations'
      }
    ]
  }
};

interface DynamicFieldRendererProps {
  enabledTemplates: string[];
  customFields?: FieldConfig[];
  formData: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  onGroupToggle?: (groupId: string, enabled: boolean) => void;
  projectStatus?: string;
}

export function DynamicFieldRenderer({ 
  enabledTemplates, 
  customFields = [], 
  formData, 
  onFieldChange,
  onGroupToggle,
  projectStatus = 'active'
}: DynamicFieldRendererProps) {
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const toggleGroup = (groupId: string) => {
    const newCollapsed = new Set(collapsedGroups);
    if (newCollapsed.has(groupId)) {
      newCollapsed.delete(groupId);
    } else {
      newCollapsed.add(groupId);
    }
    setCollapsedGroups(newCollapsed);
  };

  const renderField = (field: FieldConfig) => {
    const value = formData[field.id] || field.defaultValue || '';

    switch (field.type) {
      case 'text':
      case 'number':
        // Special handling for client_name field
        if (field.id === 'client_name') {
          return (
            <IntelligentClientInput
              value={value}
              onChange={(newValue) => onFieldChange(field.id, newValue)}
              placeholder={field.placeholder}
              disabled={false}
            />
          );
        }
        
        return (
          <Input
            type={field.type}
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            required={field.required}
          />
        );

      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            rows={3}
          />
        );

      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => onFieldChange(field.id, val)}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option.charAt(0).toUpperCase() + option.slice(1).replace('-', ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'radio':
        return (
          <RadioGroup 
            value={value} 
            onValueChange={(val) => onFieldChange(field.id, val)}
            className="flex flex-wrap gap-4"
          >
            {field.options?.map((option) => (
              <div key={option} className="flex items-center space-x-2">
                <RadioGroupItem value={option} id={`${field.id}-${option}`} />
                <Label htmlFor={`${field.id}-${option}`}>
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              checked={value}
              onCheckedChange={(checked) => onFieldChange(field.id, checked)}
              id={field.id}
            />
            <Label htmlFor={field.id}>Yes</Label>
          </div>
        );

      case 'rating':
        return (
          <RadioGroup 
            value={value?.toString()} 
            onValueChange={(val) => onFieldChange(field.id, parseInt(val))}
            className="flex gap-4"
          >
            {Array.from({ length: (field.max || 5) - (field.min || 1) + 1 }, (_, i) => {
              const rating = (field.min || 1) + i;
              return (
                <div key={rating} className="flex items-center space-x-2">
                  <RadioGroupItem value={rating.toString()} id={`${field.id}-${rating}`} />
                  <Label htmlFor={`${field.id}-${rating}`}>{rating}</Label>
                </div>
              );
            })}
          </RadioGroup>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <Slider
              value={[value || field.min || 0]}
              onValueChange={(vals) => onFieldChange(field.id, vals[0])}
              min={field.min || 0}
              max={field.max || 100}
              step={field.step || 1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{field.min || 0}</span>
              <span className="font-medium">{value || field.min || 0}</span>
              <span>{field.max || 100}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const activeGroups = enabledTemplates
    .map(templateId => templateFieldGroups[templateId])
    .filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Core Fields */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Core Project Information
            <Badge variant="secondary">Required</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {coreFields.map((field) => (
            <div key={field.id} className="space-y-2">
              <Label htmlFor={field.id}>
                {field.label} {field.required && <span className="text-destructive">*</span>}
              </Label>
              {renderField(field)}
              {field.description && (
                <p className="text-sm text-muted-foreground">{field.description}</p>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Template-based Field Groups */}
      {activeGroups.map((group) => {
        const isCollapsed = collapsedGroups.has(group.id);
        
        return (
          <Card key={group.id} className="transition-all">
            <CardHeader 
              className="cursor-pointer pb-3"
              onClick={() => toggleGroup(group.id)}
            >
              <CardTitle className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="truncate">{group.title}</span>
                  <Badge variant="outline" className="whitespace-nowrap flex-shrink-0">
                    {group.template?.charAt(0).toUpperCase() + group.template?.slice(1)}
                  </Badge>
                </div>
                <div className="flex-shrink-0">
                  {isCollapsed ? (
                    <ChevronRight className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </div>
              </CardTitle>
              {group.description && (
                <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{group.description}</p>
              )}
            </CardHeader>
            {!isCollapsed && (
              <CardContent className="space-y-4">
                {group.fields.map((field) => (
                  <div key={field.id} className="space-y-2">
                    <Label htmlFor={field.id}>
                      {field.label} {field.required && <span className="text-destructive">*</span>}
                    </Label>
                    {renderField(field)}
                    {field.description && (
                      <p className="text-sm text-muted-foreground">{field.description}</p>
                    )}
                  </div>
                ))}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Custom Fields */}
      {customFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Custom Fields
              <Badge variant="secondary">Organization Specific</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {customFields.map((field) => (
              <div key={field.id} className="space-y-2">
                <Label htmlFor={field.id}>
                  {field.label} {field.required && <span className="text-destructive">*</span>}
                </Label>
                {renderField(field)}
                {field.description && (
                  <p className="text-sm text-muted-foreground">{field.description}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes Field */}
      <Card>
        <CardHeader>
          <CardTitle>Additional Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes & Lessons Learned</Label>
            <Textarea
              id="notes"
              value={formData.notes || ''}
              onChange={(e) => onFieldChange('notes', e.target.value)}
              placeholder="Share key insights, challenges overcome, or lessons learned..."
              rows={4}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dynamic Status-Specific Fields */}
      <DynamicFormFields
        projectStatus={projectStatus as ProjectLifecycleStatus}
        formData={formData}
        onFieldChange={onFieldChange}
        isCompleted={projectStatus === 'completed'}
      />
    </div>
  );
}