import { useOnboarding, type OnboardingStep } from "@/hooks/useOnboarding";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { 
  CheckCircle, 
  Circle, 
  ArrowRight, 
  ArrowLeft,
  Home,
  FolderOpen,
  Brain,
  FileText,
  Trophy,
  X
} from "lucide-react";

const ONBOARDING_STEPS: { 
  key: OnboardingStep; 
  label: string; 
  icon: React.ReactNode;
  description: string;
}[] = [
  {
    key: 'welcome',
    label: 'Welcome',
    icon: <Home className="h-4 w-4" />,
    description: 'Get started'
  },
  {
    key: 'overview',
    label: 'Overview',
    icon: <Home className="h-4 w-4" />,
    description: 'Executive dashboard'
  },
  {
    key: 'projects',
    label: 'Projects',
    icon: <FolderOpen className="h-4 w-4" />,
    description: 'Portfolio management'
  },
  {
    key: 'insights',
    label: 'Insights',
    icon: <Brain className="h-4 w-4" />,
    description: 'AI analytics'
  },
  {
    key: 'reports',
    label: 'Reports',
    icon: <FileText className="h-4 w-4" />,
    description: 'Professional reporting'
  },
  {
    key: 'complete',
    label: 'Complete',
    icon: <Trophy className="h-4 w-4" />,
    description: 'Tour finished'
  }
];

interface OnboardingProgressProps {
  className?: string;
  variant?: 'floating' | 'embedded';
}

export const OnboardingProgress = ({ 
  className = "", 
  variant = 'floating' 
}: OnboardingProgressProps) => {
  const { 
    currentStep, 
    completedSteps, 
    nextStep, 
    previousStep, 
    finishOnboarding,
    isOnboarding 
  } = useOnboarding();

  if (!isOnboarding || !currentStep) return null;

  const currentStepIndex = ONBOARDING_STEPS.findIndex(step => step.key === currentStep);
  const totalSteps = ONBOARDING_STEPS.length - 1; // Exclude welcome step from count
  const progressSteps = ONBOARDING_STEPS.slice(1); // Remove welcome from progress display

  const getStepStatus = (stepKey: OnboardingStep) => {
    if (completedSteps.includes(stepKey)) return 'completed';
    if (stepKey === currentStep) return 'current';
    return 'upcoming';
  };

  if (variant === 'embedded') {
    return (
      <Card className={`border-primary/20 bg-primary/5 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                Demo Tour
              </Badge>
              <span className="text-sm text-muted-foreground">
                Step {Math.max(currentStepIndex, 1)} of {totalSteps}
              </span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={finishOnboarding}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            {progressSteps.map((step, index) => {
              const status = getStepStatus(step.key);
              return (
                <div key={step.key} className="flex items-center gap-2 flex-shrink-0">
                  <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 transition-all ${
                    status === 'completed' 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : status === 'current'
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted bg-background text-muted-foreground'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : (
                      <Circle className="h-3 w-3" />
                    )}
                  </div>
                  <span className={`text-xs font-medium ${
                    status === 'current' ? 'text-primary' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                  {index < progressSteps.length - 1 && (
                    <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Floating variant
  return (
    <Card className={`fixed bottom-4 right-4 z-50 shadow-lg border-primary/20 bg-background/95 backdrop-blur-sm ${className}`}>
      <CardContent className="p-4 min-w-[280px]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="text-xs">
              <Brain className="h-3 w-3 mr-1" />
              Demo Tour
            </Badge>
            <span className="text-sm text-muted-foreground">
              {Math.max(currentStepIndex, 1)}/{totalSteps}
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={finishOnboarding}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            {ONBOARDING_STEPS.find(s => s.key === currentStep)?.icon}
            <span className="font-medium text-sm">
              {ONBOARDING_STEPS.find(s => s.key === currentStep)?.label}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            {ONBOARDING_STEPS.find(s => s.key === currentStep)?.description}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mb-4">
          <div className="w-full bg-muted rounded-full h-1.5">
            <div 
              className="bg-primary h-1.5 rounded-full transition-all duration-500"
              style={{ 
                width: `${(Math.max(currentStepIndex, 1) / totalSteps) * 100}%` 
              }}
            />
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={previousStep}
            disabled={currentStepIndex <= 1}
            className="flex-1"
          >
            <ArrowLeft className="h-3 w-3 mr-1" />
            Back
          </Button>
          <Button
            size="sm"
            onClick={currentStep === 'complete' ? finishOnboarding : nextStep}
            className="flex-1"
          >
            {currentStep === 'complete' ? 'Finish' : 'Next'}
            {currentStep !== 'complete' && <ArrowRight className="h-3 w-3 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};