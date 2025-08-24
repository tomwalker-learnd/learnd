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
    count: lessons.filter(lesson => lesson.satisfaction === i + 1).length
  }));

  // Prepare budget data with brand colors
  const budgetData = [
    { status: 'Under', count: lessons.filter(l => l.budget_status === 'under').length },
    { status: 'On Budget', count: lessons.filter(l => l.budget_status === 'on').length },
    { status: 'Over', count: lessons.filter(l => l.budget_status === 'over').length }
  ].filter(item => item.count > 0);

  // Brand colors for budget chart
  const BUDGET_COLORS = {
    'Under': '#FF6F61', // --brand-start
    'On Budget': '#9AA4AF', // neutral gray
    'Over': '#5B3DF5' // --brand-end
  };

  // Prepare scope changes data with brand colors
  const scopeData = [
    { 
      name: 'No Changes', 
      value: lessons.filter(l => !l.scope_change).length,
      color: '#FF6F61' // --brand-start for positive outcome
    },
    { 
      name: 'Had Changes', 
      value: lessons.filter(l => l.scope_change).length,
      color: '#5B3DF5' // --brand-end for changes needed
    }
  ].filter(item => item.value > 0);

  // Timeline data with brand colors
  const timelineData = [
    { status: 'Early', count: lessons.filter(l => l.timeline_status === 'early').length },
    { status: 'On Time', count: lessons.filter(l => l.timeline_status === 'on-time').length },
    { status: 'Late', count: lessons.filter(l => l.timeline_status === 'late').length }
  ].filter(item => item.count > 0);

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
              <defs>
                <linearGradient id="satisfactionGradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#FF6F61" />
                  <stop offset="100%" stopColor="#5B3DF5" />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="rating" />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="count" 
                fill="url(#satisfactionGradient)" 
              />
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
                {budgetData.map((entry) => (
                  <Cell key={`cell-${entry.status}`} fill={BUDGET_COLORS[entry.status as keyof typeof BUDGET_COLORS]} />
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
                <Bar dataKey="count" fill="#FF4F8A" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}