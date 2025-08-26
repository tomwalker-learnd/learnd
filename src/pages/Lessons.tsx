import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Lesson, LessonFilters } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Filter, RefreshCw, Plus, Star } from 'lucide-react';

const Lessons = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [filteredLessons, setFilteredLessons] = useState<Lesson[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [filters, setFilters] = useState<LessonFilters>({});
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    } else if (user) {
      fetchLessons();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, loading]);

  useEffect(() => {
    applyFilters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lessons, filters, searchTerm]);

  const fetchLessons = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const supabaseClient = supabase as any;
      const { data, error } = await supabaseClient
        .from('lessons')
        .select('*')
        .eq('created_by', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLessons(data || []);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      toast({
        title: "Error",
        description: "Failed to fetch lessons. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = lessons.filter(lesson => {
      const matchesSearch = searchTerm === '' || 
        lesson.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.client_name && lesson.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = !filters.role || lesson.role.toLowerCase().includes(filters.role.toLowerCase());
      const matchesClient = !filters.client_name || 
        (lesson.client_name && lesson.client_name.toLowerCase().includes(filters.client_name.toLowerCase()));
      const matchesBudget = !filters.budget_status || filters.budget_status.includes(lesson.budget_status);
      const matchesTimeline = !filters.timeline_status || 
        filters.timeline_status.some(status => lesson.timeline_status.includes(status));
      const matchesSatisfaction = !filters.satisfaction || filters.satisfaction.includes(lesson.satisfaction);
      const matchesScopeChange = filters.scope_change === undefined || lesson.scope_change === filters.scope_change;

      return matchesSearch && matchesRole && matchesClient && matchesBudget && 
             matchesTimeline && matchesSatisfaction && matchesScopeChange;
    });

    setFilteredLessons(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'under': return 'bg-green-100 text-green-800';
      case 'on': return 'bg-blue-100 text-blue-800';
      case 'over': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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

  const renderSatisfactionStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i} 
            className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} 
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Pagination
  const totalPages = Math.ceil(filteredLessons.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLessons = filteredLessons.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <DashboardHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Lessons</h1>
              <p className="text-muted-foreground">Manage and review your captured insights</p>
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              {showFilters ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button
              variant="outline"
              onClick={fetchLessons}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button onClick={() => navigate('/submit')}>
              <Plus className="h-4 w-4 mr-2" />
              New Lesson
            </Button>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filter Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <Input
                    id="search"
                    placeholder="Project, role, or client..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                
                <div>
                  <Label>Budget Status</Label>
                  <Select
                    value={filters.budget_status?.[0] || ''} 
                    onValueChange={(value) =>
                      setFilters(prev => ({...prev, budget_status: value ? [value as any] : undefined}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All statuses</SelectItem>
                      <SelectItem value="under">Under Budget</SelectItem>
                      <SelectItem value="on">On Budget</SelectItem>
                      <SelectItem value="over">Over Budget</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Timeline Status</Label>
                  <Select
                    value={filters.timeline_status?.[0] || ''} 
                    onValueChange={(value) =>
                      setFilters(prev => ({...prev, timeline_status: value ? [value] : undefined}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All timelines" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All timelines</SelectItem>
                      <SelectItem value="early">Delivered Early</SelectItem>
                      <SelectItem value="on-time">On Time</SelectItem>
                      <SelectItem value="late">Delivered Late</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Satisfaction</Label>
                  <Select
                    value={filters.satisfaction?.[0]?.toString() || ''} 
                    onValueChange={(value) =>
                      setFilters(prev => ({...prev, satisfaction: value ? [parseInt(value)] : undefined}))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All ratings" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All ratings</SelectItem>
                      <SelectItem value="5">5 Stars</SelectItem>
                      <SelectItem value="4">4 Stars</SelectItem>
                      <SelectItem value="3">3 Stars</SelectItem>
                      <SelectItem value="2">2 Stars</SelectItem>
                      <SelectItem value="1">1 Star</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <Button variant="outline" onClick={clearFilters}>
                Clear All Filters
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Results */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Lessons ({filteredLessons.length})</CardTitle>
                <CardDescription>
                  {filteredLessons.length === lessons.length 
                    ? `Showing all ${lessons.length} lessons`
                    : `Showing ${filteredLessons.length} of ${lessons.length} lessons`
                  }
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading lessons...</div>
            ) : filteredLessons.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  {lessons.length === 0 ? 'No lessons found. Create your first lesson!' : 'No lessons match your current filters.'}
                </p>
                {lessons.length === 0 && (
                  <Button onClick={() => navigate('/submit')}>
                    <Plus className="h-4 w-4 mr-2" />
                    Create First Lesson
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* Table with safe horizontal scroll and wrapping cells */}
                <div className="-mx-4 overflow-x-auto md:mx-0">
                  <Table className="min-w-full table-fixed">
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-40 md:w-auto">Project</TableHead>
                        <TableHead className="w-36 md:w-auto">Role</TableHead>
                        <TableHead className="w-40 md:w-auto">Client</TableHead>
                        <TableHead className="w-32 md:w-auto">Satisfaction</TableHead>
                        <TableHead className="w-36 md:w-auto">Budget</TableHead>
                        <TableHead className="w-32 md:w-auto">Timeline</TableHead>
                        <TableHead className="w-32 md:w-auto">Scope Change</TableHead>
                        <TableHead className="w-32 md:w-auto">Created</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedLessons.map((lesson) => (
                        <TableRow key={lesson.id} className="[&>td]:align-top">
                          <TableCell className="break-words max-w-[12rem]">
                            {lesson.project_name}
                          </TableCell>
                          <TableCell className="break-words max-w-[10rem]">
                            {lesson.role}
                          </TableCell>
                          <TableCell className="break-words max-w-[12rem]">
                            {lesson.client_name || '-'}
                          </TableCell>
                          <TableCell>
                            {renderSatisfactionStars(lesson.satisfaction)}
                          </TableCell>
                          <TableCell>
                            <Badge className={getBudgetStatusColor(lesson.budget_status)}>
                              {formatBudgetStatus(lesson.budget_status)}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize break-words">
                            {lesson.timeline_status.replace('-', ' ')}
                          </TableCell>
                          <TableCell>
                            <Badge variant={lesson.scope_change ? "destructive" : "secondary"}>
                              {lesson.scope_change ? 'Yes' : 'No'}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap">
                            {new Date(lesson.created_at).toLocaleDateString()}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-6">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    
                    <span className="text-sm text-muted-foreground px-4">
                      Page {currentPage} of {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Lessons;
