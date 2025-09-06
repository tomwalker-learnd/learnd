import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Target, 
  Users, 
  FileText,
  TrendingUp,
  BarChart3
} from 'lucide-react';
import { ProjectLifecycleStatus } from '@/lib/statusUtils';

interface DynamicFormFieldsProps {
  projectStatus: ProjectLifecycleStatus;
  formData: Record<string, any>;
  onFieldChange: (fieldId: string, value: any) => void;
  isCompleted?: boolean;
}

export function DynamicFormFields({ 
  projectStatus, 
  formData, 
  onFieldChange, 
  isCompleted = false 
}: DynamicFormFieldsProps) {
  const [focusAreas, setFocusAreas] = useState<string[]>([]);

  useEffect(() => {
    // Set focus areas based on project status
    switch (projectStatus) {
      case 'active':
        setFocusAreas(['current_challenges', 'next_steps', 'risk_mitigation', 'resource_needs']);
        break;
      case 'on_hold':
        setFocusAreas(['blockers', 'restart_conditions', 'resource_needs', 'stakeholder_communication']);
        break;
      case 'completed':
        setFocusAreas(['outcomes', 'lessons_learned', 'final_metrics', 'knowledge_transfer']);
        break;
      case 'cancelled':
        setFocusAreas(['cancellation_reason', 'lessons_learned', 'resource_recovery', 'stakeholder_communication']);
        break;
    }
  }, [projectStatus]);

  const getFocusFieldsForStatus = (status: ProjectLifecycleStatus) => {
    const baseFields = [
      {
        id: 'notes',
        label: 'Project Notes',
        type: 'textarea',
        placeholder: 'General project notes and observations...',
        rows: 3
      }
    ];

    switch (status) {
      case 'active':
        return [
          {
            id: 'current_challenges',
            label: 'Current Challenges',
            type: 'textarea',
            placeholder: 'What obstacles are you currently facing?',
            required: false,
            rows: 3
          },
          {
            id: 'next_steps',
            label: 'Next Steps',
            type: 'textarea',
            placeholder: 'What are the immediate next actions?',
            required: false,
            rows: 3
          },
          {
            id: 'risk_mitigation',
            label: 'Risk Mitigation',
            type: 'textarea',
            placeholder: 'How are you addressing potential risks?',
            required: false,
            rows: 3
          },
          {
            id: 'team_morale',
            label: 'Team Morale',
            type: 'select',
            options: ['1', '2', '3', '4', '5'],
            placeholder: 'Rate team morale (1-5)',
            required: false
          },
          ...baseFields
        ];

      case 'on_hold':
        return [
          {
            id: 'blockers',
            label: 'Current Blockers',
            type: 'textarea',
            placeholder: 'What is preventing progress on this project?',
            required: true,
            rows: 4
          },
          {
            id: 'restart_conditions',
            label: 'Restart Conditions',
            type: 'textarea',
            placeholder: 'What needs to happen to resume this project?',
            required: false,
            rows: 3
          },
          {
            id: 'resource_needs',
            label: 'Resource Requirements',
            type: 'textarea',
            placeholder: 'What resources will be needed to restart?',
            required: false,
            rows: 3
          },
          {
            id: 'estimated_hold_duration',
            label: 'Estimated Hold Duration',
            type: 'select',
            options: ['1-2 weeks', '1 month', '2-3 months', '6+ months', 'Indefinite'],
            placeholder: 'How long do you expect this hold to last?',
            required: false
          },
          ...baseFields
        ];

      case 'completed':
        return [
          {
            id: 'completion_summary',
            label: 'Completion Summary',
            type: 'textarea',
            placeholder: 'Summarize key outcomes, deliverables, and achievements...',
            required: true,
            rows: 4
          },
          {
            id: 'lessons_learned',
            label: 'Key Lessons Learned',
            type: 'textarea',
            placeholder: 'What would you do differently? What worked well?',
            required: false,
            rows: 4
          },
          {
            id: 'final_budget_assessment',
            label: 'Final Budget Assessment',
            type: 'textarea',
            placeholder: 'How did actual costs compare to budget? Any surprises?',
            required: false,
            rows: 3
          },
          {
            id: 'final_timeline_assessment',
            label: 'Final Timeline Assessment',
            type: 'textarea',
            placeholder: 'How did delivery timing compare to plan? What caused delays/early delivery?',
            required: false,
            rows: 3
          },
          {
            id: 'stakeholder_feedback',
            label: 'Stakeholder Feedback',
            type: 'textarea',
            placeholder: 'Key feedback from client/stakeholders about the project...',
            required: false,
            rows: 3
          },
          {
            id: 'knowledge_transfer_status',
            label: 'Knowledge Transfer',
            type: 'select',
            options: ['Complete', 'In Progress', 'Not Started', 'Not Required'],
            placeholder: 'Status of knowledge transfer to client/team',
            required: false
          },
          ...baseFields
        ];

      case 'cancelled':
        return [
          {
            id: 'cancellation_reason',
            label: 'Cancellation Reason',
            type: 'textarea',
            placeholder: 'Why was this project cancelled? What led to this decision?',
            required: true,
            rows: 4
          },
          {
            id: 'lessons_learned',
            label: 'Lessons Learned',
            type: 'textarea',
            placeholder: 'What can be learned from this cancellation for future projects?',
            required: false,
            rows: 3
          },
          {
            id: 'resource_recovery',
            label: 'Resource Recovery',
            type: 'textarea',
            placeholder: 'How were team members and resources reallocated?',
            required: false,
            rows: 3
          },
          {
            id: 'client_relationship_impact',
            label: 'Client Relationship Impact',
            type: 'select',
            options: ['No Impact', 'Minor Impact', 'Moderate Impact', 'Significant Impact'],
            placeholder: 'How did cancellation affect client relationship?',
            required: false
          },
          ...baseFields
        ];

      default:
        return baseFields;
    }
  };

  const isFieldEditable = (fieldId: string) => {
    if (!isCompleted) return true;
    
    // For completed projects, allow editing of completion-specific fields
    const completionFields = [
      'notes',
      'completion_summary',
      'lessons_learned',
      'final_budget_assessment',
      'final_timeline_assessment',
      'stakeholder_feedback',
      'knowledge_transfer_status'
    ];
    
    return completionFields.includes(fieldId);
  };

  const renderField = (field: any) => {
    const value = formData[field.id] || '';
    const disabled = !isFieldEditable(field.id);

    switch (field.type) {
      case 'textarea':
        return (
          <Textarea
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={field.rows || 3}
            disabled={disabled}
          />
        );

      case 'select':
        return (
          <Select 
            value={value} 
            onValueChange={(val) => onFieldChange(field.id, val)}
            disabled={disabled}
          >
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option: string) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'number':
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={disabled}
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => onFieldChange(field.id, e.target.value)}
            placeholder={field.placeholder}
            disabled={disabled}
          />
        );
    }
  };

  const getStatusIcon = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case 'active': return <Target className="h-5 w-5 text-green-600" />;
      case 'on_hold': return <Clock className="h-5 w-5 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-5 w-5 text-blue-600" />;
      case 'cancelled': return <AlertTriangle className="h-5 w-5 text-red-600" />;
    }
  };

  const getStatusDescription = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case 'active': 
        return 'Focus on current progress, challenges, and next steps for ongoing work.';
      case 'on_hold': 
        return 'Document blockers and define conditions needed to restart this project.';
      case 'completed': 
        return 'Capture final outcomes, lessons learned, and knowledge for future projects.';
      case 'cancelled': 
        return 'Document cancellation reasons and learnings to improve future project decisions.';
    }
  };

  const fields = getFocusFieldsForStatus(projectStatus);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(projectStatus)}
          {projectStatus.replace('_', ' ').toUpperCase()} Project Information
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {getStatusDescription(projectStatus)}
        </p>
        
        {isCompleted && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This project is completed. Most fields are read-only to preserve historical data.
            </AlertDescription>
          </Alert>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label}
              {'required' in field && field.required && <span className="text-destructive ml-1">*</span>}
            </Label>
            {renderField(field)}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}