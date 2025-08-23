import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RefreshCw, Search, Filter, Star, Clock, DollarSign, Settings } from 'lucide-react';
import { Lesson, LessonFilters, Client } from '@/types';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface LessonsListProps {
  lessons: Lesson[];
  clients: Client[];
  filters: LessonFilters;
  onFiltersChange: (filters: LessonFilters) => void;
  loading: boolean;
  onRefresh: () => void;
}

export function LessonsList({ 
  lessons, 
  clients, 
  filters, 
  onFiltersChange, 
  loading, 
  onRefresh 
}: LessonsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filter lessons based on search and filters
  const filteredLessons = lessons.filter(lesson => {
    // Search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      if (!lesson.project_name.toLowerCase().includes(search) &&
          !lesson.role.toLowerCase().includes(search) &&
          !(lesson.notes?.toLowerCase().includes(search))) {
        return false;
      }
    }

    // Other filters
    if (filters.satisfaction && !filters.satisfaction.includes(lesson.satisfaction_rating)) {
      return false;
    }
    
    if (filters.budget_status && !filters.budget_status.includes(lesson.budget_status)) {
      return false;
    }
    
    if (filters.timeline_status && !filters.timeline_status.includes(lesson.timeline_status)) {
      return false;
    }
    
    if (filters.scope_changes !== undefined && lesson.scope_changes !== filters.scope_changes) {
      return false;
    }

    return true;
  });

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'over': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTimelineStatusColor = (status: string) => {
    switch (status) {
      case 'early': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'on_time': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'delayed': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const formatTimelineStatus = (status: string) => {
    switch (status) {
      case 'on_time': return 'On Time';
      case 'early': return 'Early';
      case 'delayed': return 'Delayed';
      default: return status;
    }
  };

  const formatBudgetStatus = (status: string) => {
    switch (status) {
      case 'under': return 'Under Budget';
      case 'on': return 'On Budget';
      case 'over': return 'Over Budget';
      default: return status;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Lessons Learned ({filteredLessons.length})
            </CardTitle>
            <CardDescription>
              Filter and search through your project insights
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button variant="outline" size="sm" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Search */}
        <div className="flex gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search lessons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
            />
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <Select onValueChange={(value) => 
              onFiltersChange({ ...filters, budget_status: value === 'all' ? undefined : [value] })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Budget Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Budget Status</SelectItem>
                <SelectItem value="under">Under Budget</SelectItem>
                <SelectItem value="on">On Budget</SelectItem>
                <SelectItem value="over">Over Budget</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => 
              onFiltersChange({ ...filters, timeline_status: value === 'all' ? undefined : [value] })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Timeline Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Timeline Status</SelectItem>
                <SelectItem value="early">Early</SelectItem>
                <SelectItem value="on_time">On Time</SelectItem>
                <SelectItem value="delayed">Delayed</SelectItem>
              </SelectContent>
            </Select>

            <Select onValueChange={(value) => 
              onFiltersChange({ 
                ...filters, 
                scope_changes: value === 'all' ? undefined : value === 'true' 
              })
            }>
              <SelectTrigger>
                <SelectValue placeholder="Scope Changes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="true">Had Changes</SelectItem>
                <SelectItem value="false">No Changes</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              onFiltersChange({});
              setSearchTerm('');
            }}>
              Clear All
            </Button>
          </div>
        )}

        {/* Lessons List */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              Loading lessons...
            </div>
          ) : filteredLessons.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {lessons.length === 0 ? (
                <div>
                  <p className="text-lg font-medium mb-2">No lessons captured yet</p>
                  <p>Start by capturing your first project lesson!</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium mb-2">No lessons match your filters</p>
                  <p>Try adjusting your search terms or filters</p>
                </div>
              )}
            </div>
          ) : (
            filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-lg">{lesson.project_name}</h3>
                        <Badge variant="outline">{lesson.role}</Badge>
                        {lesson.client && (
                          <div className="flex items-center gap-1">
                            <Avatar className="h-5 w-5">
                              <AvatarFallback className="text-xs">
                                {lesson.client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-muted-foreground">{lesson.client.name}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Badge className="flex items-center gap-1">
                          <Star className="h-3 w-3" />
                          {lesson.satisfaction_rating}/5
                        </Badge>
                        
                        <Badge className={getBudgetStatusColor(lesson.budget_status)}>
                          <DollarSign className="h-3 w-3 mr-1" />
                          {formatBudgetStatus(lesson.budget_status)}
                        </Badge>
                        
                        <Badge className={getTimelineStatusColor(lesson.timeline_status)}>
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTimelineStatus(lesson.timeline_status)}
                        </Badge>
                        
                        {lesson.scope_changes && (
                          <Badge variant="outline">
                            <Settings className="h-3 w-3 mr-1" />
                            Scope Changed
                          </Badge>
                        )}
                      </div>

                      {lesson.notes && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {lesson.notes}
                        </p>
                      )}

                      <p className="text-xs text-muted-foreground">
                        Created {new Date(lesson.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
