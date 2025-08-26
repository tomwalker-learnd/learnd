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
        title: 'Error',
        description: 'Failed to fetch lessons. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    const filtered = lessons.filter((lesson) => {
      const matchesSearch =
        searchTerm === '' ||
        lesson.project_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lesson.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lesson.client_name && lesson.client_name.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesRole = !filters.role || lesson.role.toLowerCase().includes(filters.role.toLowerCase());
      const matchesClient =
        !filters.client_name ||
        (lesson.client_name && lesson.client_name.toLowerCase().includes(filters.client_name.toLowerCase()));
      const matchesBudget = !filters.budget_status || filters.budget_status.includes(lesson.budget_status);
      const matchesTimeline =
        !filters.timeline_status || filters.timeline_status.some((status) => lesson.timeline_status.includes(status));
      const matchesSatisfaction = !filters.satisfaction || filters.satisfaction.includes(lesson.satisfaction);
      const matchesScopeChange =
        filters.scope_change === undefined || lesson.scope_change === filters.scope_change;

      return (
        matchesSearch &&
        matchesRole &&
        matchesClient &&
        matchesBudget &&
        matchesTimeline &&
        matchesSatisfaction &&
        matchesScopeChange
      );
    });

    setFilteredLessons(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setSearchTerm('');
  };

  const getBudgetStatusColor = (status: string) => {
    switch (status) {
      case 'under':
        return 'bg-green-100 text-green-800';
      case 'on':
        return 'bg-blue-100 text-blue-800';
      case 'over':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatBudgetStatus = (status: string) => {
    switch (status) {
      case 'under':
        return 'Under Budget';
      case 'on':
        return 'On Budget';
      case 'over':
        return 'Over Budget';
      default:
        return status;
    }
  };

  const renderSatisfactionStars = (rating: number) => {
    return (
      <div className="flex">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className={`h-4 w-4 ${i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`} />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
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
    <div className="min-h-screen w-full overflow-x-hidden bg-background">
      <DashboardHeader />

      <main className="container mx-auto px-4 py-8">
        {/* Header + Actions */}
        <div className="mb-8">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Project Lessons</h1>
              <p className="text-muted-foreground">Manage and review your captured insights</p>
            </div>
          </div>

          {/* Responsive actions: centered/stacked on mobile, inline on md+ */}
          <div className="py-4">
            <div className="grid grid-cols-1 justify-items-center gap-3 md:flex md:flex-wrap md:justify-end">
              <Button
                variant="outline"
                className="w-full max-w-xs md:w-auto"
                onClick={() => setShowFilters((s) => !s)}
              >
                <Filter className="mr-2 h-4 w-4" />
                {showFilters ? 'Hide Filters' : 'Show Filters'}
              </Button>
              <Button
                variant="outline"
                className="w-full max-w-xs md:w-auto"
                onClick={fetchLessons}
                disabled={isLoading}
              >
                <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button className="w-full max-w-xs md:w-auto" onClick={() => navigate('/submit')}>
                <Plus className="mr-2 h-4 w-4" />
                New Lesson
              </Button>
            </div>
          </div>
        </div>

        {/* Filters */}
        {showFilters && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Filter Lessons</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 lg:grid-cols-4">
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
                      setFilters((prev) => ({ ...prev, budget_status: value ? [value as any] : undefined }))
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
                      setFilters((prev) => ({ ...prev, timeline_status: value ? [value] : undefined }))
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
                      setFilters((prev) => ({ ...prev, satisfaction: value ? [parseInt(value)] : undefined }))
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

              <Button variant="outline" className="mt-4" onClick={clearFilters}>
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
                    : `Showing ${filteredLessons.length} of ${lessons.length} lessons`}
                </CardDescription>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="py-8 text-center">Loading lessons...</div>
            ) : filteredLessons.length === 0 ? (
              <div className="py-8 text-center">
                <p className="mb-4 text-muted-foreground">
                  {lessons.length === 0
                    ? 'No lessons found. Create your first lesson!'
                    : 'No lessons match your current filters.'}
                </p>
                {lessons.length === 0 && (
                  <Button onClick={() => navigate('/submit')}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Lesson
                  </Button>
                )}
              </div>
            ) : (
              <>
                {/* MOBILE: stacked list cards */}
                <div className="space-y-3 md:hidden">
                  {paginatedLessons.map((lesson) => (
                    <div key={lesson.id} className="rounded-lg border p-4">
                      <div className="text-base font-medium break-words">{lesson.project_name}</div>
                      <div className="mt-1 text-sm text-muted-foreground break-words">
                        <span className="font-medium">Role:</span> {lesson.role || '—'}
                      </div>
                      <div className="text-sm text-muted-foreground break-words">
                        <span className="font-medium">Client:</span> {lesson.client_name || '—'}
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="text-sm">{renderSatisfactionStars(lesson.satisfaction)}</span>
                        <Badge className={getBudgetStatusColor(lesson.budget_status)}>
                          {formatBudgetStatus(lesson.budget_status)}
                        </Badge>
                        <Badge variant={lesson.scope_change ? 'destructive' : 'secondary'}>
                          {lesson.scope_change ? 'Scope Change' : 'No Scope Change'}
                        </Badge>
                        <span className="text-sm capitalize">{lesson.timeline_status.replace('-', ' ')}</span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground whitespace-nowrap">
                        {new Date(lesson.created_at).toLocaleDateString()}
                      </div>

                      {/* Optional per-row actions; keep simple for now */}
                      {/* <div className="mt-3 grid grid-cols-2 gap-2">
                        <Button variant="outline" className="w-full">Open</Button>
                        <Button className="w-full">Edit</Button>
                      </div> */}
                    </div>
                  ))}
                </div>

                {/* DESKTOP/TABLET: table with safe horizontal scroll */}
                <div className="hidden md:block">
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
                            <TableCell className="max-w-[12rem] break-words">{lesson.project_name}</TableCell>
                            <TableCell className="max-w-[10rem] break-words">{lesson.role}</TableCell>
                            <TableCell className="max-w-[12rem] break-words">
                              {lesson.client_name || '-'}
                            </TableCell>
                            <TableCell>{renderSatisfactionStars(lesson.satisfaction)}</TableCell>
                            <TableCell>
                              <Badge className={getBudgetStatusColor(lesson.budget_status)}>
                                {formatBudgetStatus(lesson.budget_status)}
                              </Badge>
                            </TableCell>
                            <TableCell className="break-words capitalize">
                              {lesson.timeline_status.replace('-', ' ')}
                            </TableCell>
                            <TableCell>
                              <Badge variant={lesson.scope_change ? 'destructive' : 'secondary'}>
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
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-6 flex items-center justify-center space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>

                    <span className="px-4 text-sm text-muted-foreground">
                      Page {currentPage} of {totalPages}
                    </span>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
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
