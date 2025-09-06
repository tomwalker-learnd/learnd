import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Eye, EyeOff, Settings2 } from 'lucide-react';

interface FieldGroup {
  id: string;
  title: string;
  description: string;
  fieldCount: number;
  template?: string;
  enabled: boolean;
  canToggle: boolean;
}

interface FieldGroupToggleProps {
  fieldGroups: FieldGroup[];
  onToggle: (groupId: string, enabled: boolean) => void;
}

export function FieldGroupToggle({ fieldGroups, onToggle }: FieldGroupToggleProps) {
  console.log('FieldGroupToggle received fieldGroups:', fieldGroups);
  
  const coreGroup = fieldGroups.find(group => group.id === 'core');
  const templateGroups = fieldGroups.filter(group => group.template);
  const customGroup = fieldGroups.find(group => group.id === 'custom');
  
  console.log('Filtered groups:', { 
    coreGroup: !!coreGroup, 
    templateGroupsCount: templateGroups.length, 
    customGroup: !!customGroup 
  });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Settings2 className="h-5 w-5" />
          Field Modules
        </h3>
        <p className="text-sm text-muted-foreground">
          Control which field groups appear in your project forms.
        </p>
      </div>

      <div className="space-y-4">
        {/* Show helpful message if only core group exists */}
        {fieldGroups.length === 1 && coreGroup && (
          <Card className="border-l-4 border-l-yellow-500 bg-yellow-50/30">
            <CardHeader>
              <CardTitle className="text-base text-yellow-800">No Configurable Field Groups</CardTitle>
              <CardDescription className="text-yellow-700">
                You currently only have the required core fields. To add configurable field groups:
                <ul className="mt-2 ml-4 list-disc space-y-1">
                  <li>Go back to step 1 to select industry templates</li>
                  <li>Add custom fields in the previous steps</li>
                  <li>Or continue with just the core fields</li>
                </ul>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Core Fields - Always Enabled */}
        {coreGroup && (
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-base flex items-center gap-2">
                    {coreGroup.title}
                    <Badge variant="secondary">Required</Badge>
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {coreGroup.description}
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{coreGroup.fieldCount} fields</Badge>
                  <div className="flex items-center gap-2 opacity-50">
                    <Switch checked={true} disabled />
                    <Eye className="h-4 w-4" />
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Template Groups */}
        {templateGroups.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Industry Templates</h4>
            {templateGroups.map((group) => (
              <Card key={group.id} className={`transition-opacity ${!group.enabled && 'opacity-75'}`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        {group.title}
                        {group.template && (
                          <Badge variant="outline">
                            {group.template.charAt(0).toUpperCase() + group.template.slice(1)}
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="text-sm">
                        {group.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{group.fieldCount} fields</Badge>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`toggle-${group.id}`} className="sr-only">
                          Toggle {group.title}
                        </Label>
                        <Switch
                          id={`toggle-${group.id}`}
                          checked={group.enabled}
                          onCheckedChange={(enabled) => onToggle(group.id, enabled)}
                          disabled={!group.canToggle}
                        />
                        {group.enabled ? (
                          <Eye className="h-4 w-4 text-primary" />
                        ) : (
                          <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}

        {/* Custom Fields Group */}
        {customGroup && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Custom Fields</h4>
            <Card className={`transition-opacity ${!customGroup.enabled && 'opacity-75'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      {customGroup.title}
                      <Badge variant="secondary">Organization Specific</Badge>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {customGroup.description}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {customGroup.fieldCount} field{customGroup.fieldCount !== 1 ? 's' : ''}
                    </Badge>
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`toggle-${customGroup.id}`} className="sr-only">
                        Toggle {customGroup.title}
                      </Label>
                      <Switch
                        id={`toggle-${customGroup.id}`}
                        checked={customGroup.enabled}
                        onCheckedChange={(enabled) => onToggle(customGroup.id, enabled)}
                        disabled={!customGroup.canToggle || customGroup.fieldCount === 0}
                      />
                      {customGroup.enabled ? (
                        <Eye className="h-4 w-4 text-primary" />
                      ) : (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
      </div>

      {/* Summary */}
      <Card className="bg-muted/30">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Active field groups: {fieldGroups.filter(g => g.enabled).length}/{fieldGroups.length}
            </span>
            <span className="text-muted-foreground">
              Total fields: {fieldGroups.filter(g => g.enabled).reduce((sum, g) => sum + g.fieldCount, 0)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}