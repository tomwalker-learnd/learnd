import { useState } from 'react';
import { useUserTier } from '@/hooks/useUserTier';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, Lock, Settings, Edit } from 'lucide-react';
import PremiumFeature from '@/components/premium/PremiumFeature';

interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'select' | 'radio' | 'checkbox' | 'rating' | 'slider';
  required: boolean;
  placeholder?: string;
  options?: string[];
  min?: number;
  max?: number;
  step?: number;
  description?: string;
}

interface CustomFieldBuilderProps {
  customFields: CustomField[];
  onFieldsChange: (fields: CustomField[]) => void;
  maxFields?: number;
}

const fieldTypes = [
  { value: 'text', label: 'Text Input', description: 'Single line text field' },
  { value: 'number', label: 'Number Input', description: 'Numeric input with validation' },
  { value: 'textarea', label: 'Text Area', description: 'Multi-line text field' },
  { value: 'select', label: 'Dropdown', description: 'Select from predefined options' },
  { value: 'radio', label: 'Radio Buttons', description: 'Single choice from multiple options' },
  { value: 'checkbox', label: 'Checkbox', description: 'Yes/no or true/false field' },
  { value: 'rating', label: 'Rating Scale', description: 'Numeric rating (1-5, 1-10, etc.)' },
  { value: 'slider', label: 'Slider', description: 'Range input with min/max values' }
];

export function CustomFieldBuilder({ customFields, onFieldsChange, maxFields = 10 }: CustomFieldBuilderProps) {
  const { tier, canAccessCustomDashboards } = useUserTier();
  const [isBuilding, setIsBuilding] = useState(false);
  const [currentField, setCurrentField] = useState<Partial<CustomField>>({
    type: 'text',
    required: false
  });

  const canAddMoreFields = customFields.length < maxFields;
  const isBusinessTier = tier === 'business' || tier === 'enterprise';

  const handleAddField = () => {
    if (!currentField.label || !currentField.type) return;

    const newField: CustomField = {
      id: `custom_${Date.now()}`,
      label: currentField.label,
      type: currentField.type as CustomField['type'],
      required: currentField.required || false,
      placeholder: currentField.placeholder,
      options: currentField.options,
      min: currentField.min,
      max: currentField.max,
      step: currentField.step,
      description: currentField.description
    };

    onFieldsChange([...customFields, newField]);
    setCurrentField({ type: 'text', required: false });
    setIsBuilding(false);
  };

  const handleDeleteField = (fieldId: string) => {
    onFieldsChange(customFields.filter(field => field.id !== fieldId));
  };

  const handleUpdateField = (fieldId: string, updates: Partial<CustomField>) => {
    onFieldsChange(customFields.map(field => 
      field.id === fieldId ? { ...field, ...updates } : field
    ));
  };

  const getFieldLimits = () => {
    switch (tier) {
      case 'business': return 10;
      case 'enterprise': return Infinity;
      default: return 0;
    }
  };

  const fieldLimit = getFieldLimits();

  return (
    <PremiumFeature requiredTier="business">
      <div className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Custom Field Builder
            </h3>
            <Badge variant="secondary">
              {customFields.length}/{fieldLimit === Infinity ? '∞' : fieldLimit} fields
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Create custom fields specific to your organization's tracking needs.
          </p>
        </div>

        {/* Existing Custom Fields */}
        {customFields.length > 0 && (
          <div className="space-y-4">
            <h4 className="font-medium">Your Custom Fields</h4>
            <div className="space-y-3">
              {customFields.map((field) => (
                <Card key={field.id} className="border-l-4 border-l-primary">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">{field.label}</h5>
                          {field.required && <Badge variant="destructive">Required</Badge>}
                          <Badge variant="outline">
                            {fieldTypes.find(type => type.value === field.type)?.label}
                          </Badge>
                        </div>
                        {field.description && (
                          <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
                        )}
                        {field.placeholder && (
                          <p className="text-xs text-muted-foreground">
                            Placeholder: {field.placeholder}
                          </p>
                        )}
                        {field.options && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {field.options.map((option, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {option}
                              </Badge>
                            ))
                            }
                          </div>
                        )}
                        {(field.min !== undefined || field.max !== undefined) && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Range: {field.min || 0} - {field.max || '∞'}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 ml-4">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => {
                            setCurrentField(field);
                            setIsBuilding(true);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDeleteField(field.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
              }
            </div>
          </div>
        )}

        {/* Add New Field Button */}
        {!isBuilding && canAddMoreFields && (
          <Button 
            onClick={() => setIsBuilding(true)}
            variant="outline" 
            className="w-full border-dashed"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Custom Field
          </Button>
        )}

        {/* Field Builder Form */}
        {isBuilding && (
          <Card className="border-primary/50">
            <CardHeader>
              <CardTitle className="text-base">
                {currentField.id ? 'Edit Custom Field' : 'Create New Custom Field'}
              </CardTitle>
              <CardDescription>
                Configure the field properties and validation rules.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Field Label */}
              <div className="space-y-2">
                <Label htmlFor="field-label">Field Label *</Label>
                <Input
                  id="field-label"
                  value={currentField.label || ''}
                  onChange={(e) => setCurrentField(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="Enter field label"
                />
              </div>

              {/* Field Type */}
              <div className="space-y-2">
                <Label htmlFor="field-type">Field Type *</Label>
                <Select 
                  value={currentField.type || 'text'} 
                  onValueChange={(value) => setCurrentField(prev => ({ 
                    ...prev, 
                    type: value as CustomField['type'],
                    // Reset type-specific properties
                    options: undefined,
                    min: undefined,
                    max: undefined,
                    step: undefined
                  }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fieldTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div>
                          <div className="font-medium">{type.label}</div>
                          <div className="text-xs text-muted-foreground">{type.description}</div>
                        </div>
                      </SelectItem>
                    ))
                    }
                  </SelectContent>
                </Select>
              </div>

              {/* Field Description */}
              <div className="space-y-2">
                <Label htmlFor="field-description">Description</Label>
                <Textarea
                  id="field-description"
                  value={currentField.description || ''}
                  onChange={(e) => setCurrentField(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Optional description or help text"
                  rows={2}
                />
              </div>

              {/* Placeholder (for text/number fields) */}
              {(['text', 'number', 'textarea'].includes(currentField.type!)) && (
                <div className="space-y-2">
                  <Label htmlFor="field-placeholder">Placeholder</Label>
                  <Input
                    id="field-placeholder"
                    value={currentField.placeholder || ''}
                    onChange={(e) => setCurrentField(prev => ({ ...prev, placeholder: e.target.value }))}
                    placeholder="Enter placeholder text"
                  />
                </div>
              )}

              {/* Options (for select/radio fields) */}
              {(['select', 'radio'].includes(currentField.type!)) && (
                <div className="space-y-2">
                  <Label htmlFor="field-options">Options (one per line) *</Label>
                  <Textarea
                    id="field-options"
                    value={currentField.options?.join('\n') || ''}
                    onChange={(e) => setCurrentField(prev => ({ 
                      ...prev, 
                      options: e.target.value.split('\n').filter(opt => opt.trim()) 
                    }))}
                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                    rows={4}
                  />
                </div>
              )}

              {/* Min/Max (for number/rating/slider fields) */}
              {(['number', 'rating', 'slider'].includes(currentField.type!)) && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="field-min">Minimum Value</Label>
                    <Input
                      id="field-min"
                      type="number"
                      value={currentField.min || ''}
                      onChange={(e) => setCurrentField(prev => ({ 
                        ...prev, 
                        min: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      placeholder="Min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="field-max">Maximum Value</Label>
                    <Input
                      id="field-max"
                      type="number"
                      value={currentField.max || ''}
                      onChange={(e) => setCurrentField(prev => ({ 
                        ...prev, 
                        max: e.target.value ? Number(e.target.value) : undefined 
                      }))}
                      placeholder="Max"
                    />
                  </div>
                </div>
              )}

              {/* Step (for number/slider fields) */}
              {(['number', 'slider'].includes(currentField.type!)) && (
                <div className="space-y-2">
                  <Label htmlFor="field-step">Step Size</Label>
                  <Input
                    id="field-step"
                    type="number"
                    value={currentField.step || ''}
                    onChange={(e) => setCurrentField(prev => ({ 
                      ...prev, 
                      step: e.target.value ? Number(e.target.value) : undefined 
                    }))}
                    placeholder="1"
                    step="0.1"
                  />
                </div>
              )}

              {/* Required Checkbox */}
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="field-required"
                  checked={currentField.required}
                  onCheckedChange={(checked) => setCurrentField(prev => ({ 
                    ...prev, 
                    required: !!checked 
                  }))}
                />
                <Label htmlFor="field-required">Required field</Label>
              </div>

              <Separator />

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  onClick={handleAddField}
                  disabled={!currentField.label || !currentField.type}
                  className="flex-1"
                >
                  {currentField.id ? 'Update Field' : 'Add Field'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsBuilding(false);
                    setCurrentField({ type: 'text', required: false });
                  }}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Field Limit Warning */}
        {!canAddMoreFields && fieldLimit !== Infinity && (
          <Card className="border-destructive/20 bg-destructive/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Lock className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium">Field Limit Reached</p>
                  <p className="text-sm text-muted-foreground">
                    You've reached the maximum of {fieldLimit} custom fields for your tier.
                  </p>
                </div>
                {tier === 'business' && (
                  <Button variant="destructive" size="sm" className="ml-auto">
                    Upgrade to Enterprise
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PremiumFeature>
  );
}
