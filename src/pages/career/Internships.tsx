import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Users, Search, Plus, MapPin, Clock, Calendar, Building, Filter, DollarSign, Loader2, Save, Edit, Trash2, TrendingUp, Star, ArrowRight, Bookmark } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contentApi, userApi, Internship } from '@/services/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

const Internships = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [internships, setInternships] = useState<Internship[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateContent = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);
  const canSaveContent = hasPermission(Permission.CONTENT_SAVE);

  const internshipTypes = ['Full-time', 'Part-time', 'Remote', 'Hybrid'];

  // Fetch internships from API
  const fetchInternships = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (selectedLocation !== 'all') {
          params.location = selectedLocation;
        }
        if (selectedType !== 'all') {
          params.internship_type = selectedType;
        }

        const response = await contentApi.getInternships(params);
        setInternships(response.internships || []);
      } catch (err) {
        console.error('Error fetching internships:', err);
        setError('Failed to load internships. Using sample data.');

        // Fallback to dummy data
        setInternships([
          {
            internship_id: 1,
            content_id: 1,
            user_id: 2,
            title: 'Legal Research Intern',
            summary: 'Assist with legal research and document preparation.',
            content: 'We are seeking motivated law students for our summer internship program...',
            featured_image: '',
            tags: 'Research,Litigation',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            status: 'Active',
            is_featured: false,
            company_name: 'Johnson Law Firm',
            location: 'Boston, MA',
            internship_type: 'Full-time',
            stipend: '$2,000/month',
            duration: '3 months',
            eligibility_criteria: 'Current law student, 2L or 3L preferred',
            application_deadline: '2024-03-15',
            contact_email: 'internships@johnsonlaw.com',
            contact_phone: '+1-555-0789',
            internship_is_featured: false,
            posted_by: 'HR Coordinator',
          },
          {
            internship_id: 2,
            content_id: 2,
            user_id: 2,
            title: 'Corporate Law Intern',
            summary: 'Support corporate legal team with contract review.',
            content: 'Join our corporate legal team to gain hands-on experience...',
            featured_image: '',
            tags: 'Corporate,Contracts',
            created_at: '2024-01-12T00:00:00Z',
            updated_at: '2024-01-12T00:00:00Z',
            status: 'Active',
            is_featured: false,
            company_name: 'BigCorp Legal',
            location: 'Chicago, IL',
            internship_type: 'Part-time',
            stipend: '$1,500/month',
            duration: '6 months',
            eligibility_criteria: 'Law student with corporate law interest',
            application_deadline: '2024-02-28',
            contact_email: 'careers@bigcorplegal.com',
            contact_phone: '+1-555-0456',
            internship_is_featured: false,
            posted_by: 'Legal Director',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchInternships();
  }, [selectedLocation, selectedType]);

  const handleSaveInternship = async (internship: Internship) => {
    try {
      await userApi.saveContent({ content_id: internship.content_id, notes: `Saved internship: ${internship.title} at ${internship.company_name}` });
      toast({
        title: "Success",
        description: "Internship saved to your personal library successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save internship. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInternship = async (internshipId: number) => {
    if (!confirm('Are you sure you want to delete this internship posting? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteInternship(internshipId);
      toast({
        title: "Success",
        description: "Internship posting deleted successfully.",
      });
      // Refresh internships to remove deleted internship
      fetchInternships();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete internship posting. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Get unique locations from internships
  const locations = Array.from(new Set(internships.map(internship => internship.location))).filter(Boolean);

  const filteredInternships = internships.filter(internship => {
    const tags = internship.tags ? internship.tags.split(',').map(tag => tag.trim()) : [];
    const matchesSearch = internship.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         internship.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
                    <Users className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Legal Internship Programs
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Launch your legal career with hands-on experience and mentorship
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{filteredInternships.length} Available Programs</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{internships.filter(i => i.internship_is_featured).length} Featured</span>
                  </div>
                </div>
              </div>

              {canCreateContent && (
                <Button
                  asChild
                  size="lg"
                  className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group border border-gray-200"
                >
                  <Link to="/internships/create">
                    <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                    Post New Program
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
                  <CardTitle className="text-lg text-black modern-heading">Find Your Ideal Program</CardTitle>
                  <p className="text-gray-600 text-sm">Search and filter through internship opportunities</p>
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
                      <SelectValue placeholder="Program Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {internshipTypes.map((type) => (
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
                  <Users className="h-8 w-8 text-amber-600" />
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

          {/* Enhanced Internships List */}
          {!loading && (
            <div className="space-y-6">
              {filteredInternships.map((internship) => {
                const tags = internship.tags ? internship.tags.split(',').map(tag => tag.trim()) : [];
                return (
                  <Card key={internship.internship_id} className="group border-2 border-gray-100  shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white hover:-translate-y-1 transform-gpu">
                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                            <Users className="h-6 w-6 text-gray-800" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl hover:text-gray-600 transition-colors text-black modern-heading group-hover:text-gray-900">
                              <Link to={`/internships/${internship.internship_id}`} className="flex items-center gap-2">
                                {internship.title}
                                {internship.internship_is_featured && (
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
                                {internship.company_name}
                              </span>
                              <span className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-800" />
                                {internship.location}
                              </span>
                              <span className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-800" />
                                {internship.duration}
                              </span>
                              <Badge variant="outline" className="border-gray-800 text-gray-800 bg-gray-50">
                                {internship.internship_type}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-2">
                          {internship.stipend && (
                            <div className="flex items-center gap-2 text-gray-900 font-bold text-lg">
                              <DollarSign className="h-5 w-5 text-gray-800" />
                              {internship.stipend}
                            </div>
                          )}
                          <p className="text-sm text-gray-600 font-medium">
                            Deadline: {format(new Date(internship.application_deadline), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <p className="text-gray-700 mb-6 line-clamp-2 text-lg leading-relaxed">{internship.summary || internship.content}</p>

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
                              Posted {format(new Date(internship.created_at), 'MMM dd, yyyy')}
                            </span>
                          </div>

                          <div className="flex items-center gap-3">
                            <Button
                              asChild
                              className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                            >
                              <Link to={`/internships/${internship.internship_id}`}>
                                View Details
                                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                              </Link>
                            </Button>

                            {canSaveContent && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSaveInternship(internship)}
                                className="flex items-center gap-2 border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-all duration-300"
                              >
                                <Bookmark className="h-4 w-4" />
                                Save
                              </Button>
                            )}

                            {/* Show edit button for admin (all internships) or editor (own internships only) */}
                            {((user?.role === UserRole.ADMIN) ||
                              (user?.role === UserRole.EDITOR && internship.user_id === parseInt(user.id))) && (
                              <Button variant="outline" size="sm" asChild className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-4 py-2 rounded-xl font-medium transition-all duration-300">
                                <Link to={`/internships/${internship.internship_id}/edit`}>
                                  <Edit className="h-4 w-4 mr-1" />
                                  Edit
                                </Link>
                              </Button>
                            )}

                            {/* Show delete button for admin (all internships) or editor (own internships only) */}
                            {((user?.role === UserRole.ADMIN) ||
                              (user?.role === UserRole.EDITOR && internship.user_id === parseInt(user.id))) && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDeleteInternship(internship.internship_id)}
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
          {!loading && filteredInternships.length === 0 && (
            <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
              <CardContent className="text-center py-16">
                <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                  <Users className="h-16 w-16 text-gray-600" />
                </div>
                <h3 className="text-2xl font-bold text-black mb-3 modern-heading">
                  No Programs Available
                </h3>
                <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                  {searchTerm || selectedLocation !== 'all' || selectedType !== 'all'
                    ? 'Try adjusting your search criteria or filters to find more programs.'
                    : 'Be the first to discover new internship opportunities when they become available.'
                  }
                </p>
                {canCreateContent && (
                  <Button
                    asChild
                    size="lg"
                    className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                  >
                    <Link to="/internships/create">
                      <Plus className="h-5 w-5 mr-3 group-hover:rotate-90 transition-transform duration-300" />
                      Post Your First Program
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

export default Internships;
