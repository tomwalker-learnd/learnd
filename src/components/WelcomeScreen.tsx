import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useOnboarding } from "@/hooks/useOnboarding";
import { 
  Brain, 
  Shield, 
  FileText, 
  ArrowRight,
  Upload,
  Sparkles,
  TrendingUp,
  Users,
  Star,
  CheckCircle
} from "lucide-react";

export const WelcomeScreen = () => {
  const navigate = useNavigate();
  const { goToStep } = useOnboarding();
  const [isStarting, setIsStarting] = useState(false);

  const handleExploreWithSampleData = async () => {
    setIsStarting(true);
    
    // Mark onboarding as started
    localStorage.setItem('onboarding_started', 'true');
    
    // Navigate to overview with onboarding active
    setTimeout(() => {
      goToStep('overview');
    }, 300);
  };

  const handleImportProjects = () => {
    // Mark onboarding as completed for users who want to import immediately
    localStorage.setItem('onboarding_completed', 'true');
    navigate('/project-wizard');
  };

  const valueProps = [
    {
      icon: <Brain className="h-6 w-6 text-primary" />,
      title: "AI-Powered Insights",
      description: "Automatically detect patterns, risks, and opportunities across your project portfolio"
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Early Risk Detection",
      description: "Get alerted to budget overruns, scope creep, and timeline issues before they become critical"
    },
    {
      icon: <FileText className="h-6 w-6 text-primary" />,
      title: "Executive Reports",
      description: "Generate professional client reports and portfolio summaries in seconds"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="mb-6">
            <Badge variant="secondary" className="mb-4 text-sm font-medium">
              <Sparkles className="h-4 w-4 mr-1" />
              Portfolio Intelligence Platform
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              See what your project portfolio is{" "}
              <span className="bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                really telling you
              </span>
            </h1>
          </div>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Transform project chaos into strategic intelligence with AI-powered insights, 
            automated risk detection, and professional reporting.
          </p>
        </div>

        {/* Value Propositions */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {valueProps.map((prop, index) => (
            <Card 
              key={index} 
              className={`border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg animate-fade-in hover-scale`}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className="mb-4 flex justify-center">
                  <div className="p-3 rounded-full bg-primary/10">
                    {prop.icon}
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{prop.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {prop.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* CTA Section */}
        <div className="text-center space-y-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="space-y-4">
            <Button
              size="lg"
              onClick={handleExploreWithSampleData}
              disabled={isStarting}
              className="px-8 py-6 text-lg font-semibold bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary shadow-lg hover:shadow-xl transition-all duration-300 hover-scale"
            >
              {isStarting ? (
                <>
                  <div className="animate-spin h-5 w-5 mr-2 border-2 border-white border-t-transparent rounded-full" />
                  Loading Sample Data...
                </>
              ) : (
                <>
                  <TrendingUp className="mr-2 h-5 w-5" />
                  Explore with Sample Data
                  <ArrowRight className="ml-2 h-5 w-5" />
                </>
              )}
            </Button>
            
            <div className="text-sm text-muted-foreground">
              See real portfolio intelligence in action • No signup required
            </div>
          </div>

          <div className="flex items-center justify-center gap-4">
            <div className="h-px bg-border flex-1 max-w-20"></div>
            <span className="text-sm text-muted-foreground">or</span>
            <div className="h-px bg-border flex-1 max-w-20"></div>
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={handleImportProjects}
            className="px-6 py-3 border-2 hover:border-primary hover:bg-primary/5 transition-all duration-300"
          >
            <Upload className="mr-2 h-5 w-5" />
            Import Your Projects
          </Button>
        </div>

        {/* Social Proof */}
        <div className="mt-12 text-center animate-fade-in" style={{ animationDelay: '0.6s' }}>
          <div className="flex items-center justify-center gap-2 text-muted-foreground mb-4">
            <div className="flex items-center gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-4 w-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm">Trusted by project teams worldwide</span>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              <span>Join 500+ teams making smarter project decisions</span>
            </div>
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="mt-16 grid md:grid-cols-2 lg:grid-cols-4 gap-4 text-center">
          {[
            { icon: <CheckCircle className="h-4 w-4" />, text: "No credit card required" },
            { icon: <CheckCircle className="h-4 w-4" />, text: "Instant setup" },
            { icon: <CheckCircle className="h-4 w-4" />, text: "Sample data included" },
            { icon: <CheckCircle className="h-4 w-4" />, text: "Full feature preview" }
          ].map((feature, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center gap-2 text-sm text-muted-foreground animate-fade-in"
              style={{ animationDelay: `${0.8 + index * 0.1}s` }}
            >
              <div className="text-emerald-500">{feature.icon}</div>
              {feature.text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};