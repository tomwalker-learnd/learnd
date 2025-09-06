import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Brain, 
  TrendingDown, 
  Users, 
  Clock, 
  DollarSign,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Lightbulb
} from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

interface AIInsightModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInteractionComplete?: () => void;
}

const sampleChartData = [
  { project_type: "Tech", budget_overrun_rate: 40, projects: 8 },
  { project_type: "Consulting", budget_overrun_rate: 15, projects: 12 },
  { project_type: "Marketing", budget_overrun_rate: 25, projects: 6 },
  { project_type: "Operations", budget_overrun_rate: 20, projects: 4 }
];

export const AIInsightModal = ({ isOpen, onClose, onInteractionComplete }: AIInsightModalProps) => {
  const [showRecommendations, setShowRecommendations] = useState(false);

  const handleViewRecommendations = () => {
    setShowRecommendations(true);
    onInteractionComplete?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Brain className="h-6 w-6 text-primary" />
            AI Portfolio Analysis: Budget Performance by Project Type
            <Badge variant="secondary" className="text-xs">Q3 2024 Analysis</Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Key Finding */}
          <Card className="border-amber-200 bg-amber-50/50 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
                <AlertTriangle className="h-5 w-5" />
                Key Pattern Detected
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-amber-700 dark:text-amber-200 leading-relaxed">
                Your technology projects are <strong>40% more likely to go over budget</strong> than consulting projects. 
                This pattern emerged in Q3 2024 and shows a strong correlation with team size and project complexity.
              </p>
            </CardContent>
          </Card>

          {/* Data Visualization */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Budget Overrun Rate by Project Type</CardTitle>
              <p className="text-sm text-muted-foreground">
                Analysis of {sampleChartData.reduce((sum, d) => sum + d.projects, 0)} projects completed in Q3 2024
              </p>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sampleChartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="project_type" />
                    <YAxis label={{ value: 'Overrun Rate (%)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip 
                      formatter={(value, name) => [`${value}%`, 'Budget Overrun Rate']}
                      labelFormatter={(label) => `${label} Projects`}
                    />
                    <Bar 
                      dataKey="budget_overrun_rate" 
                      fill="hsl(var(--primary))"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Contributing Factors */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Users className="h-4 w-4" />
                  Team Size Impact
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Tech teams (avg 8 people)</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">+25% overrun risk</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Consulting teams (avg 4 people)</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">-15% overrun risk</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4" />
                  Timeline Correlation
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Projects &gt; 3 months</span>
                  <Badge variant="outline" className="text-red-600 border-red-200">+35% overrun risk</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm">Projects &lt; 2 months</span>
                  <Badge variant="outline" className="text-green-600 border-green-200">-20% overrun risk</Badge>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recommendations */}
          {!showRecommendations ? (
            <div className="text-center py-6">
              <Button 
                onClick={handleViewRecommendations}
                size="lg"
                className="gap-2"
              >
                <Lightbulb className="h-4 w-4" />
                View AI Recommendations
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <Card className="border-primary/20 bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                  <Lightbulb className="h-5 w-5" />
                  AI-Generated Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Optimize Tech Team Size</h4>
                      <p className="text-sm text-muted-foreground">
                        Consider breaking large tech projects into smaller teams (4-6 people) or shorter sprints to reduce budget overrun risk.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Extend Timeline Buffer</h4>
                      <p className="text-sm text-muted-foreground">
                        Add 20% timeline buffer for tech projects over 3 months to account for complexity and integration challenges.
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-emerald-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="font-medium">Implement Scope Controls</h4>
                      <p className="text-sm text-muted-foreground">
                        Establish stricter change management processes for tech projects to prevent scope creep.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <DollarSign className="h-4 w-4" />
                    <span>Potential savings: <strong className="text-primary">$124,000</strong> annually if implemented</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close Analysis
          </Button>
          {showRecommendations && (
            <Button onClick={onClose}>
              Implement Recommendations
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};