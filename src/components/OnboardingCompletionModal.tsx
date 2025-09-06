import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { 
  PartyPopper, 
  Upload, 
  Users, 
  Zap, 
  ArrowRight, 
  Brain,
  Target,
  Sparkles,
  CheckCircle
} from "lucide-react";

interface OnboardingCompletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportData: () => void;
  onInviteTeam: () => void;
  onStartTrial: () => void;
}

export const OnboardingCompletionModal = ({ 
  isOpen, 
  onClose,
  onImportData,
  onInviteTeam,
  onStartTrial
}: OnboardingCompletionModalProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [completionStep, setCompletionStep] = useState<"celebration" | "next-steps">("celebration");

  const handleContinueToNextSteps = () => {
    setCompletionStep("next-steps");
  };

  const handleImportProjects = () => {
    // Mark onboarding as completed
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completion_time', new Date().toISOString());
    
    onImportData();
    onClose();
    navigate('/submit-wizard');
  };

  const handleInviteTeam = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completion_time', new Date().toISOString());
    
    onInviteTeam();
    onClose();
    // Navigate to team invitation flow (placeholder)
    navigate('/settings?tab=team');
  };

  const handleStartTrial = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completion_time', new Date().toISOString());
    
    onStartTrial();
    onClose();
    // Navigate to upgrade flow (placeholder)
    navigate('/upgrade');
  };

  const handleSkipToApp = () => {
    localStorage.setItem('onboarding_completed', 'true');
    localStorage.setItem('onboarding_completion_time', new Date().toISOString());
    localStorage.setItem('onboarding_skipped_import', 'true');
    
    onClose();
    navigate('/overview');
  };

  if (completionStep === "celebration") {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="text-center">
            <div className="mx-auto mb-4 w-16 h-16 bg-gradient-to-r from-primary to-primary/60 rounded-full flex items-center justify-center">
              <PartyPopper className="h-8 w-8 text-white" />
            </div>
            <DialogTitle className="text-2xl font-bold">
              🎉 You've mastered portfolio intelligence!
            </DialogTitle>
            <DialogDescription className="text-base mt-2">
              Congratulations! You've discovered how Learnd transforms project management with AI-powered insights.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-6">
            {/* Achievement Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="text-center border-emerald-200 bg-emerald-50/50">
                <CardContent className="p-4">
                  <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-emerald-900">AI Insights</h3>
                  <p className="text-xs text-emerald-700">Pattern recognition mastered</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-blue-200 bg-blue-50/50">
                <CardContent className="p-4">
                  <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-900">Risk Detection</h3>
                  <p className="text-xs text-blue-700">Early warning system understood</p>
                </CardContent>
              </Card>
              
              <Card className="text-center border-purple-200 bg-purple-50/50">
                <CardContent className="p-4">
                  <Brain className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-900">Smart Reports</h3>
                  <p className="text-xs text-purple-700">Professional analytics ready</p>
                </CardContent>
              </Card>
            </div>

            {/* Key Learnings */}
            <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  What you've learned:
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                  <p className="text-sm">How AI identifies budget patterns before they become critical issues</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500 mt-1.5" />
                  <p className="text-sm">How to spot project risks early and take preventive action</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-purple-500 mt-1.5" />
                  <p className="text-sm">How to generate professional reports that impress stakeholders</p>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-amber-500 mt-1.5" />
                  <p className="text-sm">How portfolio intelligence transforms individual project management</p>
                </div>
              </CardContent>
            </Card>

            {/* Next Steps Button */}
            <div className="flex justify-center pt-4">
              <Button onClick={handleContinueToNextSteps} size="lg" className="gap-2">
                Continue to Next Steps
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Target className="h-6 w-6 text-primary" />
            Ready to supercharge your project management?
          </DialogTitle>
          <DialogDescription>
            Choose your next step to unlock the full power of Learnd's portfolio intelligence.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-6">
          {/* Primary CTA - Import Real Projects */}
          <Card className="border-primary/20 bg-gradient-to-r from-primary/10 to-primary/5 hover:shadow-lg transition-all cursor-pointer" 
                onClick={handleImportProjects}>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary/20 rounded-lg flex items-center justify-center">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg">Import your real projects</h3>
                  <Badge variant="secondary" className="mt-1">Recommended</Badge>
                </div>
              </CardTitle>
              <CardDescription className="text-base">
                Start capturing insights from your actual projects. Import existing data or create new project records 
                to begin generating real portfolio intelligence.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <Button className="w-full gap-2">
                <Upload className="h-4 w-4" />
                Import Real Project Data
                <ArrowRight className="h-4 w-4" />
              </Button>
            </CardContent>
          </Card>

          {/* Secondary Options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={handleInviteTeam}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-5 w-5 text-blue-600" />
                  Invite your team
                </CardTitle>
                <CardDescription>
                  Collaborate with teammates to capture insights across all your projects.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" className="w-full gap-2">
                  <Users className="h-4 w-4" />
                  Invite Teammates
                </Button>
              </CardContent>
            </Card>

            <Card className="hover:shadow-md transition-all cursor-pointer" onClick={handleStartTrial}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Zap className="h-5 w-5 text-amber-600" />
                  Start premium trial
                </CardTitle>
                <CardDescription>
                  Unlock advanced AI features, unlimited exports, and team collaboration.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <Button variant="outline" className="w-full gap-2">
                  <Sparkles className="h-4 w-4" />
                  Start Free Trial
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Skip Option */}
          <div className="text-center pt-4 border-t">
            <Button variant="ghost" onClick={handleSkipToApp} className="text-muted-foreground">
              Skip for now - explore the app
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};