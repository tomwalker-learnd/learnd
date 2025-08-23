import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PlusCircle, BookOpen, TrendingUp, Users } from 'lucide-react';
import { Lesson } from '@/types';

interface SummaryPanelProps {
  lessons: Lesson[];
}

export function SummaryPanel({ lessons }: SummaryPanelProps) {
  const navigate = useNavigate();

  const stats = {
    total: lessons.length,
    avgSatisfaction: lessons.length > 0 
      ? (lessons.reduce((acc, lesson) => acc + lesson.satisfaction_rating, 0) / lessons.length).toFixed(1)
      : '0',
    onBudget: lessons.filter(lesson => lesson.budget_status === 'on').length,
    scopeChanges: lessons.filter(lesson => lesson.scope_changes).length,
  };

  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-sm text-muted-foreground">Total Lessons</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.avgSatisfaction}</p>
                <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.onBudget}</p>
                <p className="text-sm text-muted-foreground">On Budget</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.scopeChanges}</p>
                <p className="text-sm text-muted-foreground">Scope Changes</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Action Buttons */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Start capturing new insights from your projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button 
              onClick={() => navigate('/lesson/new')}
              className="flex items-center gap-2"
            >
              <PlusCircle className="h-4 w-4" />
              Capture New Lessons
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/lesson/new')}
              className="flex items-center gap-2"
            >
              <BookOpen className="h-4 w-4" />
              Submit New Record
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => navigate('/lesson/new')}
              className="flex items-center gap-2"
            >
              <TrendingUp className="h-4 w-4" />
              Enter Your Most Recent Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}