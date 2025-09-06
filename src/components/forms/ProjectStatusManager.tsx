import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Pause, 
  X, 
  CalendarIcon,
  Calendar as CalendarIconFn
} from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { ProjectLifecycleStatus } from '@/lib/statusUtils';

interface ProjectStatusManagerProps {
  currentStatus: ProjectLifecycleStatus;
  formData: Record<string, any>;
  onStatusChange: (newStatus: ProjectLifecycleStatus, metadata: Record<string, any>) => void;
  onFieldChange: (fieldId: string, value: any) => void;
  isEditing?: boolean;
}

export function ProjectStatusManager({ 
  currentStatus, 
  formData, 
  onStatusChange, 
  onFieldChange,
  isEditing = false 
}: ProjectStatusManagerProps) {
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [selectedNewStatus, setSelectedNewStatus] = useState<ProjectLifecycleStatus | ''>('');
  const [statusChangeReason, setStatusChangeReason] = useState('');
  const [completionSummary, setCompletionSummary] = useState('');
  const [completionDate, setCompletionDate] = useState<Date>();
  const [finalSatisfaction, setFinalSatisfaction] = useState<number | ''>('');
  const [restartConditions, setRestartConditions] = useState('');
  const [blockers, setBlockers] = useState('');

  const getStatusIcon = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'on_hold': return <Pause className="h-4 w-4 text-yellow-600" />;
      case 'completed': return <CheckCircle className="h-4 w-4 text-blue-600" />;
      case 'cancelled': return <X className="h-4 w-4 text-red-600" />;
    }
  };

  const getStatusColor = (status: ProjectLifecycleStatus) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'on_hold': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getValidTransitions = (current: ProjectLifecycleStatus): ProjectLifecycleStatus[] => {
    switch (current) {
      case 'active':
        return ['on_hold', 'completed', 'cancelled'];
      case 'on_hold':
        return ['active', 'completed', 'cancelled'];
      case 'completed':
        return []; // Generally shouldn't change from completed
      case 'cancelled':
        return ['active']; // Can restart cancelled projects
      default:
        return ['active', 'on_hold', 'completed', 'cancelled'];
    }
  };

  const requiresAdditionalInfo = (newStatus: ProjectLifecycleStatus): boolean => {
    return newStatus === 'completed' || newStatus === 'on_hold' || 
           (newStatus === 'active' && (currentStatus === 'completed' || currentStatus === 'cancelled'));
  };

  const handleStatusChange = () => {
    if (!selectedNewStatus) return;

    const metadata: Record<string, any> = {
      reason: statusChangeReason,
      changed_at: new Date().toISOString(),
      previous_status: currentStatus
    };

    if (selectedNewStatus === 'completed') {
      metadata.completion_summary = completionSummary;
      metadata.completion_date = completionDate?.toISOString();
      metadata.final_satisfaction = finalSatisfaction;
    } else if (selectedNewStatus === 'on_hold') {
      metadata.blockers = blockers;
      metadata.restart_conditions = restartConditions;
    }

    onStatusChange(selectedNewStatus, metadata);
    setShowStatusModal(false);
    resetModalState();
  };

  const resetModalState = () => {
    setSelectedNewStatus('');
    setStatusChangeReason('');
    setCompletionSummary('');
    setCompletionDate(undefined);
    setFinalSatisfaction('');
    setRestartConditions('');
    setBlockers('');
  };

  const canSubmit = () => {
    if (!selectedNewStatus || !statusChangeReason) return false;
    
    if (selectedNewStatus === 'completed') {
      return completionSummary && finalSatisfaction;
    }
    
    if (selectedNewStatus === 'on_hold') {
      return blockers;
    }
    
    return true;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon(currentStatus)}
          Project Status Management
          <Badge className={cn('border', getStatusColor(currentStatus))}>
            {currentStatus.replace('_', ' ').toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label>Current Status</Label>
          <div className="flex items-center gap-2 p-3 border rounded">
            {getStatusIcon(currentStatus)}
            <span className="font-medium">{currentStatus.replace('_', ' ')}</span>
          </div>
        </div>

        {getValidTransitions(currentStatus).length > 0 && (
          <div className="space-y-2">
            <Label>Change Status</Label>
            <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
              <DialogTrigger asChild>
                <Button variant="outline" className="w-full">
                  Update Project Status
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Project Status</DialogTitle>
                  <DialogDescription>
                    Update the project lifecycle status with appropriate context.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>New Status</Label>
                    <Select value={selectedNewStatus} onValueChange={(value) => setSelectedNewStatus(value as ProjectLifecycleStatus)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select new status" />
                      </SelectTrigger>
                      <SelectContent>
                        {getValidTransitions(currentStatus).map(status => (
                          <SelectItem key={status} value={status}>
                            <div className="flex items-center gap-2">
                              {getStatusIcon(status)}
                              {status.replace('_', ' ')}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Reason for Change *</Label>
                    <Textarea
                      value={statusChangeReason}
                      onChange={(e) => setStatusChangeReason(e.target.value)}
                      placeholder="Explain why the status is changing..."
                      rows={3}
                    />
                  </div>

                  {selectedNewStatus === 'completed' && (
                    <>
                      <Alert>
                        <CheckCircle className="h-4 w-4" />
                        <AlertDescription>
                          Marking as completed requires final assessment information.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>Completion Summary *</Label>
                        <Textarea
                          value={completionSummary}
                          onChange={(e) => setCompletionSummary(e.target.value)}
                          placeholder="Summarize key outcomes, deliverables, and lessons learned..."
                          rows={4}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Completion Date</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !completionDate && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {completionDate ? format(completionDate, "PPP") : <span>Pick completion date</span>}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={completionDate}
                              onSelect={setCompletionDate}
                              initialFocus
                              className={cn("p-3 pointer-events-auto")}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Final Satisfaction Rating *</Label>
                        <Select value={finalSatisfaction.toString()} onValueChange={(value) => setFinalSatisfaction(parseInt(value))}>
                          <SelectTrigger>
                            <SelectValue placeholder="Rate final satisfaction" />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map(rating => (
                              <SelectItem key={rating} value={rating.toString()}>
                                {rating}/5 - {rating === 1 ? 'Very Unsatisfied' : 
                                           rating === 2 ? 'Unsatisfied' :
                                           rating === 3 ? 'Neutral' :
                                           rating === 4 ? 'Satisfied' : 'Very Satisfied'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}

                  {selectedNewStatus === 'on_hold' && (
                    <>
                      <Alert>
                        <Pause className="h-4 w-4" />
                        <AlertDescription>
                          Projects on hold require blocker identification and restart conditions.
                        </AlertDescription>
                      </Alert>

                      <div className="space-y-2">
                        <Label>Current Blockers *</Label>
                        <Textarea
                          value={blockers}
                          onChange={(e) => setBlockers(e.target.value)}
                          placeholder="Describe what's preventing progress..."
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label>Restart Conditions</Label>
                        <Textarea
                          value={restartConditions}
                          onChange={(e) => setRestartConditions(e.target.value)}
                          placeholder="What needs to happen to resume this project?"
                          rows={3}
                        />
                      </div>
                    </>
                  )}

                  {(selectedNewStatus === 'active' && (currentStatus === 'completed' || currentStatus === 'cancelled')) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        Reactivating a {currentStatus} project requires justification.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowStatusModal(false)}>
                      Cancel
                    </Button>
                    <Button onClick={handleStatusChange} disabled={!canSubmit()}>
                      Update Status
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}

        {currentStatus === 'completed' && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              This project is completed. Some fields may be read-only.
            </AlertDescription>
          </Alert>
        )}

        {currentStatus === 'on_hold' && (
          <Alert>
            <Pause className="h-4 w-4" />
            <AlertDescription>
              This project is on hold. Focus on blockers and restart conditions.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}