import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Lesson } from '@/types';
import { TrendingUp, BarChart3, PieChart as PieChartIcon } from 'lucide-react';

interface ChartsViewProps {
  lessons: Lesson[];
}

export function ChartsView({ lessons }: ChartsViewProps) {
  // Prepare satisfaction data
  const satisfactionData = Array.from({ length: 5 }, (_, i) => ({
    rating: i + 1,
    count: lessons.filter(lesson => lesson.satisfaction_rating === i + 1).length
  }));

  // Prepare budget data
  const budgetData = [
    { status: 'Under', count: lessons.filter(l => l.budget_status === 'under').length },
    { status: 'On Budget', count: lessons.filter(l => l.budget_status === 'on').length },
    { status: 'Over', count: lessons.filter(l => l.budget_status === 'over').length }
  ].filter(item => item.count > 0);

  // Prepare scope changes data
  const scopeData = [
    { 
      name: 'No Changes', 
      value: lessons.filter(l => !l.scope_changes).length,
      color: '#22c55e'
    },
    { 
      name: 'Had Changes', 
      value: lessons.filter(l => l.scope_changes).length,
      color: '#ef4444'
    }
  ].filter(item => item.value > 0);

  // Timeline data
  const timelineData = [
    { status: 'Early', count: lessons.filter(l => l.timeline_status === 'early').length },
    { status: 'On Time', count: lessons.filter(l => l.timeline_status === 'on_time').length },
    { status: 'Delayed', count: lessons.filter(l => l.timeline_status === 'delayed').length }
  ].filter(item => item.count > 0);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (lessons.length === 0) {
    return (
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Analytics Overview
            </CardTitle>
            <CardDescription>
              Charts will appear here once you have lesson data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No data available for visualization</p>
              <p className="text-sm">Capture some lessons to see insights!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Satisfaction Ratings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Satisfaction Ratings
          </CardTitle>
          <CardDescription>
            Distribution of project satisfaction scores
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={satisfactionData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Budget Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <PieChartIcon className="h-5 w-5" />
            Budget Performance
          </CardTitle>
          <CardDescription>
            How projects performed against budget
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={budgetData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ status, count }) => `${status}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {budgetData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Scope Changes */}
      {scopeData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Scope Changes</CardTitle>
            <CardDescription>
              Projects with vs without scope changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={scopeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {scopeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Timeline Performance */}
      {timelineData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Timeline Performance</CardTitle>
            <CardDescription>
              Project delivery timing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="hsl(var(--secondary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}