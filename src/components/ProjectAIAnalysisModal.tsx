import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, TrendingDown, AlertTriangle, Target, CheckCircle, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { OnboardingSuccessToast } from "./OnboardingSuccessToast";
import { CountdownTimer } from "./CountdownTimer";

interface ProjectAIAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInteractionComplete?: () => void;
}

const analysisData = [
  { client: "TechCorp", budgetVariance: 60, projectCount: 3 },
  { client: "StartupX", budgetVariance: 25, projectCount: 2 },
  { client: "CorpSolutions", budgetVariance: 15, projectCount: 4 },
  { client: "InnovateInc", budgetVariance: 40, projectCount: 2 }
];

export const ProjectAIAnalysisModal = ({ 
  isOpen, 
  onClose, 
  onInteractionComplete 
}: ProjectAIAnalysisModalProps) => {
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showCountdown, setShowCountdown] = useState(false);

  const handleImplementRecommendations = () => {
    setShowSuccessToast(true);
    setShowCountdown(true);
    
    if (onInteractionComplete) {
      onInteractionComplete();
    }
  };

  const handleCountdownComplete = () => {
    onClose();
    // Auto-advance to insights page will be handled by the parent component
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              Project Pattern Analysis: Mobile App Redesign
            </DialogTitle>
            <DialogDescription>
              AI-powered insights from your portfolio data
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Key Finding */}
            <Card className="border-l-4 border-l-amber-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Critical Pattern Detected
                </CardTitle>
                <CardDescription>
                  Analysis of 11 projects across your portfolio
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-base leading-relaxed">
                  <strong>Projects with TechCorp show 60% higher budget variance</strong> compared to your portfolio average. 
                  This pattern correlates with larger team sizes and aggressive timelines. The Mobile App Redesign project 
                  exhibits these same risk factors.
                </p>
              </CardContent>
            </Card>

            {/* Data Visualization */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Budget Variance by Client</CardTitle>
                <CardDescription>
                  Percentage over original budget estimates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={analysisData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="client" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip 
                        formatter={(value: any, name: string) => [
                          `${value}%`, 
                          name === 'budgetVariance' ? 'Budget Variance' : name
                        ]}
                        labelFormatter={(label) => `Client: ${label}`}
                      />
                      <Bar 
                        dataKey="budgetVariance" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Contributing Factors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-rose-600" />
                    Team Size Impact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-rose-600">8+ members</p>
                  <p className="text-xs text-muted-foreground">
                    Teams over 8 people show 45% higher budget variance
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Timeline Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-amber-600">&lt; 3 months</p>
                  <p className="text-xs text-muted-foreground">
                    Aggressive timelines increase scope creep risk
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    Client Pattern
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold text-blue-600">Tech Sector</p>
                  <p className="text-xs text-muted-foreground">
                    Technology clients request 2.3x more changes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Actionable Recommendations */}
            <Card className="border-l-4 border-l-emerald-500">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  Recommended Actions
                </CardTitle>
                <CardDescription>
                  Proven strategies from your successful projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">1</span>
                      Contract Structure
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Consider fixed-price contracts with clearly defined scope boundaries. 
                      Your CorpSolutions projects show 70% better budget adherence with this approach.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">2</span>
                      Phased Delivery
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Break into 3-4 week sprints with budget checkpoints. 
                      This reduces variance by an average of 35% in similar projects.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">3</span>
                      Team Right-Sizing
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Optimal team size for this project type: 5-6 members. 
                      Consider reducing team size and extending timeline by 20%.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-sm font-bold">4</span>
                      Client Communication
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Weekly stakeholder reviews with change request documentation. 
                      Implement approval gates for scope modifications.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t">
              <Button variant="outline" onClick={onClose}>
                Close Analysis
              </Button>
              <Button onClick={handleImplementRecommendations} className="gap-2">
                Implement Recommendations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {/* Countdown for auto-advance */}
            {showCountdown && (
              <div className="flex justify-center pt-2">
                <CountdownTimer
                  seconds={3}
                  onComplete={handleCountdownComplete}
                  message="Advancing to Insights in"
                />
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Success Toast */}
      {showSuccessToast && (
        <OnboardingSuccessToast
          title="Excellent Work!"
          description="You found a project-specific pattern that could save significant budget overruns. This is how portfolio intelligence transforms individual project management."
          showCountdown={true}
          countdownSeconds={3}
          onCountdownComplete={handleCountdownComplete}
        />
      )}
    </>
  );
};