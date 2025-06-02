import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Briefcase,
  Search,
  Filter,
  Plus,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Loader2,
  Save,
  Edit,
  Trash2,
  TrendingUp,
  Star,
  ArrowRight,
  Calendar,
  Bookmark,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { contentApi, userApi, Job } from '@/services/api';
import { format } from 'date-fns';

const Jobs = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateContent = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);
  const canSaveContent = hasPermission(Permission.CONTENT_SAVE);

  const jobTypes = ['Full-time', 'Part-time', 'Contract', 'Remote', 'Hybrid'];

  // Fetch jobs from API
  const fetchJobs = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (selectedLocation !== 'all') {
          params.location = selectedLocation;
        }
        if (selectedType !== 'all') {
          params.job_type = selectedType;
        }

        const response = await contentApi.getJobs(params);
        setJobs(response.jobs || []);
      } catch (err) {
        console.error('Error fetching jobs:', err);
        setError('Failed to load jobs. Using sample data.');

        // Fallback to dummy data
        setJobs([
          {
            job_id: 1,
            content_id: 1,
            user_id: 2,
            title: 'Senior Associate - Corporate Law',
            summary: 'Join our corporate law team to handle complex business transactions and mergers.',
            content: 'We are seeking an experienced Senior Associate to join our Corporate Law department...',
            featured_image: '',
            tags: 'Corporate Law,M&A,Securities',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            status: 'Active',
            is_featured: false,
            company_name: 'Smith & Associates',
            location: 'New York, NY',
            job_type: 'Full-time',
            salary_range: '$120,000 - $150,000',
            experience_required: '3-5 years',
            eligibility_criteria: 'JD from accredited law school, bar admission required',
            application_deadline: '2024-02-15',
            contact_email: 'careers@smithlaw.com',
            contact_phone: '+1-555-0123',
            job_is_featured: false,
            posted_by: 'HR Manager',
          },
          {
            job_id: 2,
            content_id: 2,
            user_id: 2,
            title: 'Junior Legal Counsel',
            summary: 'Support our legal team in technology and intellectual property matters.',
            content: 'We are looking for a motivated Junior Legal Counsel to support our growing tech company...',
            featured_image: '',
            tags: 'IP Law,Technology,Contracts',
            created_at: '2024-01-12T00:00:00Z',
            updated_at: '2024-01-12T00:00:00Z',
            status: 'Active',
            is_featured: false,
            company_name: 'Tech Innovations Inc.',
            location: 'San Francisco, CA',
            job_type: 'Full-time',
            salary_range: '$90,000 - $110,000',
            experience_required: '1-3 years',
            eligibility_criteria: 'JD preferred, technology background a plus',
            application_deadline: '2024-02-10',
            contact_email: 'legal@techinnovations.com',
            contact_phone: '+1-555-0456',
            job_is_featured: false,
            posted_by: 'Legal Director',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchJobs();
  }, [selectedLocation, selectedType]);

  const handleSaveJob = async (job: Job) => {
    try {
      await userApi.saveContent({ content_id: job.content_id, notes: `Saved job: ${job.title} at ${job.company_name}` });
      toast({
        title: "Success",
        description: "Job saved to your personal library successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save job. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteJob = async (jobId: number) => {
    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteJob(jobId);
      toast({
        title: "Success",
        description: "Job posting deleted successfully.",
      });
      // Refresh jobs to remove deleted job
      fetchJobs();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job posting. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get unique locations from jobs
  const locations = Array.from(new Set(jobs.map(job => job.location))).filter(Boolean);

  const filteredJobs = jobs.filter(job => {
    const tags = job.tags ? job.tags.split(',').map(tag => tag.trim()) : [];
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
                    <Briefcase className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Legal Career Opportunities
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Discover your next career milestone in the legal profession
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{filteredJobs.length} Active Positions</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{jobs.filter(j => j.job_is_featured).length} Featured</span>
                  </div>
                </div>
              </div>

              {canCreateContent && (
                <Button
                  asChild
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-200"
                >
                  <Link to="/jobs/create">
                    <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Post New Position
                    <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                  </Link>
                </Button>
              )}
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <Card className="border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shadow-md border border-gray-300">
                  <Search className="h-5 w-5 text-gray-800" />
                </div>
                <div>
                  <CardTitle className="text-lg text-black modern-heading">Find Your Perfect Position</CardTitle>
                  <CardDescription className="text-gray-600">Search and filter through available opportunities</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by title, company, or skills..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl text-lg font-medium transition-all duration-300"
                  />
                </div>
                <Select value={selectedLocation} onValueChange={setSelectedLocation}>
                  <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-600" />
                      <SelectValue placeholder="Select Location" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={selectedType} onValueChange={setSelectedType}>
                  <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-600" />
                      <SelectValue placeholder="Job Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {jobTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Loading State */}
          {loading && (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-2 border-gray-100 shadow-xl bg-white">
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-3 flex-1">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex gap-6">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        </div>
                      </div>
                      <div className="space-y-2 text-right">
                        <Skeleton className="h-5 w-28" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-2/3" />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex gap-2">
                          <Skeleton className="h-6 w-20" />
                          <Skeleton className="h-6 w-24" />
                          <Skeleton className="h-6 w-16" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-10 w-32" />
                          <Skeleton className="h-10 w-20" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Enhanced Error State */}
          {error && (
            <Card className="border-2 border-amber-200 shadow-xl bg-gradient-to-br from-amber-50 to-orange-50">
              <CardContent className="text-center py-12">
                <div className="p-4 rounded-3xl bg-amber-100 w-fit mx-auto mb-6">
                  <Briefcase className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="text-xl font-bold text-amber-800 mb-2">Connection Issue</h3>
                <p className="text-amber-700 mb-6 max-w-md mx-auto">{error}</p>
                <Button
                  onClick={() => window.location.reload()}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-6 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Enhanced Jobs List */}
          {!loading && (
            <div className="space-y-6">
              {filteredJobs.map((job) => {
                const tags = job.tags ? job.tags.split(',').map(tag => tag.trim()) : [];
                return (
                  <Card key={job.job_id} className="group border-2 border-gray-100  shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white hover:-translate-y-1 transform-gpu">
                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                            <Briefcase className="h-6 w-6 text-gray-800" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl hover:text-gray-600 transition-colors text-black modern-heading group-hover:text-gray-900">
                              <Link to={`/jobs/${job.job_id}`} className="flex items-center gap-2">
                                {job.title}
                                {job.job_is_featured && (
                                  <Badge className="bg-gradient-to-r from-gray-800 to-black text-white px-3 py-1 text-xs font-bold">
                                    <Star className="w-3 h-3 mr-1 fill-current" />
                                    Featured
                                  </Badge>
                                )}
                              </Link>
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600 mt-3">
                              <span className="flex items-center gap-2 font-medium">
                                <Building className="h-4 w-4 text-gray-800" />
                                {job.company_name}
                              </span>
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-800" />
                                {job.location}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-800" />
                                {job.job_type}
                              </span>
                              {job.job_type === 'Remote' && (
                                <Badge variant="outline" className="border-gray-800 text-gray-800 bg-gray-50">Remote</Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {job.salary_range && (
                            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                              <DollarSign className="h-5 w-5 text-gray-800" />
                              {job.salary_range}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 font-medium">
                            Deadline: {format(new Date(job.application_deadline), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-gray-700 mb-6 line-clamp-2 text-lg leading-relaxed">{job.summary || job.content}</p>

                      <div className="space-y-4">
                        {/* Tags Section */}
                        <div className="flex flex-wrap gap-2">
                          {tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="border-gray-800 text-gray-800 bg-gray-50 hover:bg-gray-100 transition-colors duration-200 px-3 py-1 font-medium">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* Actions Section */}
                        <div className="flex items-center justify-between pt-2">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Calendar className="h-4 w-4" />
                            <span className="font-medium">
                              Posted {format(new Date(job.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              asChild
                              className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                              <Link to={`/jobs/${job.job_id}`}>
                                View Details
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                              </Link>
                            </Button>

                            {canSaveContent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveJob(job)}
                                className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-all duration-300"
                              >
                                <Bookmark className="h-4 w-4" />
                                Save
                              </Button>
                            )}

                            {/* Show edit button for admin (all jobs) or editor (own jobs only) */}
                            {((user?.role === UserRole.ADMIN) ||
                              (user?.role === UserRole.EDITOR && job.user_id === parseInt(user.id))) && (
                              <Button variant="outline" size="sm" asChild className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-all duration-300">
                                <Link to={`/jobs/${job.job_id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                            )}

                            {/* Show delete button for admin (all jobs) or editor (own jobs only) */}
                            {((user?.role === UserRole.ADMIN) ||
                              (user?.role === UserRole.EDITOR && job.user_id === parseInt(user.id))) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteJob(job.job_id)}
                                className="text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 px-4 py-2 rounded-xl font-medium transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Enhanced Empty State */}
          {!loading && filteredJobs.length === 0 && (
            <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="text-center py-16">
                <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                  <Briefcase className="h-16 w-16 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3 modern-heading">
                  No Positions Available
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  {searchTerm || selectedLocation !== 'all' || selectedType !== 'all'
                    ? 'Try adjusting your search criteria or filters to find more opportunities.'
                    : 'Be the first to discover new legal career opportunities when they become available.'
                  }
                </p>
                {canCreateContent && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link to="/jobs/create">
                      <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                      Post Your First Position
                      <ArrowRight className="h-5 w-5 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
                    </Link>
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Jobs;
