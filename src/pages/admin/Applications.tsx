import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { contentApi } from '@/services/api';
import {
  Search,
  Filter,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Building,
  MapPin,
  Calendar,
  FileText,
  Mail,
  Phone,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  StickyNote,
  TrendingUp,
  Star,
  ArrowRight,
  Settings,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

interface Application {
  Application_ID: number;
  Position_ID: number;
  User_ID: number;
  Application_Date: string;
  Status: string;
  Resume_URL: string;
  Cover_Letter: string;
  Notes: string;
  Company_Name: string;
  Position_Title: string;
  Location: string;
  Position_Type: string;
  Applicant_Name: string;
  Applicant_Email: string;
  Application_Type: 'Job' | 'Internship';
}

const Applications = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  // State management
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Filter state
  const [filters, setFilters] = useState({
    type: 'all',
    status: '',
    company: '',
    search: '',
    date_from: '',
    date_to: ''
  });

  // Pagination state
  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
    total: 0
  });

  // Permission checks
  const canManageAllApplications = user && hasPermission(Permission.CONTENT_UPDATE_ALL);
  const canManageOwnApplications = user && hasPermission(Permission.CONTENT_UPDATE_OWN);

  useEffect(() => {
    if (canManageAllApplications || canManageOwnApplications) {
      fetchApplications();
    }
  }, [filters, pagination.offset, canManageAllApplications, canManageOwnApplications]);

  // Handle highlighting from URL parameters
  useEffect(() => {
    const highlightId = searchParams.get('highlight');
    if (highlightId) {
      const applicationId = parseInt(highlightId);
      if (!isNaN(applicationId)) {
        // Auto-expand the highlighted application
        setExpandedRows(prev => new Set([...prev, applicationId]));

        // Scroll to the application after a short delay to ensure it's rendered
        setTimeout(() => {
          const element = document.getElementById(`application-${applicationId}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 500);
      }
    }
  }, [searchParams, applications]);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      if (canManageAllApplications) {
        // Admin can see all applications
        const response = await contentApi.getAllApplications({
          type: filters.type as 'jobs' | 'internships' | 'research-papers' | 'all',
          status: filters.status || undefined,
          company: filters.company || undefined,
          date_from: filters.date_from || undefined,
          date_to: filters.date_to || undefined,
          limit: pagination.limit,
          offset: pagination.offset
        });

        setApplications(response.applications);
        setPagination(prev => ({ ...prev, total: response.total }));
      } else if (canManageOwnApplications) {
        // Editor can only see applications for their own postings
        const [jobApps, internshipApps] = await Promise.all([
          contentApi.getEditorJobApplications(),
          contentApi.getEditorInternshipApplications()
        ]);

        const allApps = [
          ...jobApps.applications.map(app => ({ ...app, Application_Type: 'Job' as const })),
          ...internshipApps.applications.map(app => ({ ...app, Application_Type: 'Internship' as const }))
        ];

        // Apply client-side filtering for editors
        let filteredApps = allApps;
        if (filters.status) {
          filteredApps = filteredApps.filter(app => app.Status === filters.status);
        }
        if (filters.company) {
          filteredApps = filteredApps.filter(app =>
            app.Company_Name.toLowerCase().includes(filters.company.toLowerCase())
          );
        }
        if (filters.search) {
          filteredApps = filteredApps.filter(app =>
            app.Applicant_Name.toLowerCase().includes(filters.search.toLowerCase()) ||
            app.Position_Title.toLowerCase().includes(filters.search.toLowerCase())
          );
        }

        setApplications(filteredApps);
        setPagination(prev => ({ ...prev, total: filteredApps.length }));
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
      toast({
        title: "Error",
        description: "Failed to load applications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: string, notes?: string) => {
    try {
      const application = applications.find(app => app.Application_ID === applicationId);
      if (!application) return;

      if (application.Application_Type === 'Job') {
        await contentApi.updateJobApplicationStatus(applicationId, { status: newStatus, notes });
      } else if (application.Application_Type === 'Internship') {
        await contentApi.updateInternshipApplicationStatus(applicationId, { status: newStatus, notes });
      } else if (application.Application_Type === 'Research_Paper') {
        await contentApi.updateResearchPaperApplicationStatus(applicationId, { status: newStatus, comments: notes });
      }

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
      });

      // Refresh applications
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'outline';
      case 'shortlisted': return 'default';
      case 'rejected': return 'destructive';
      case 'hired':
      case 'selected': return 'default';
      case 'approved': return 'default';
      case 'needs revision': return 'outline';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'reviewed': return <Eye className="h-3 w-3" />;
      case 'shortlisted': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'hired':
      case 'selected': return <CheckCircle className="h-3 w-3" />;
      case 'approved': return <CheckCircle className="h-3 w-3" />;
      case 'needs revision': return <StickyNote className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const toggleRowExpansion = (applicationId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(applicationId)) {
      newExpanded.delete(applicationId);
    } else {
      newExpanded.add(applicationId);
    }
    setExpandedRows(newExpanded);
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setPagination(prev => ({ ...prev, offset: 0 })); // Reset to first page
  };

  const clearFilters = () => {
    setFilters({
      type: 'all',
      status: '',
      company: '',
      search: '',
      date_from: '',
      date_to: ''
    });
  };

  if (!canManageAllApplications && !canManageOwnApplications) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-2 border-gray-100 shadow-xl bg-white">
            <CardContent className="text-center py-16">
              <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                <Settings className="h-16 w-16 text-gray-600" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-4 modern-heading">Access Restricted</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                You need appropriate permissions to view and manage applications. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

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
                    <Settings className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Application Management
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      {canManageAllApplications ? 'Manage all job and internship applications across the platform' : 'Manage applications for your posted positions'}
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{pagination.total} Total Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">
                      {canManageAllApplications ? 'Admin Access' : 'Editor Access'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Filters */}
          <Card className="border-2 border-gray-100 shadow-xl bg-white">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-3 text-xl modern-heading">
                <div className="p-2 rounded-xl bg-white shadow-md border border-gray-300">
                  <Filter className="h-5 w-5 text-gray-800" />
                </div>
                Search & Filter Applications
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-3">
                  <Label htmlFor="search" className="text-sm font-semibold text-gray-800">Search Applications</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
                    <Input
                      id="search"
                      placeholder="Search applicants or positions..."
                      value={filters.search}
                      onChange={(e) => handleFilterChange('search', e.target.value)}
                      className="pl-10 border-2 border-gray-200 focus:border-gray-900 rounded-xl"
                    />
                  </div>
                </div>

                {canManageAllApplications && (
                  <div className="space-y-3">
                    <Label htmlFor="type" className="text-sm font-semibold text-gray-800">Application Type</Label>
                    <Select value={filters.type || "all"} onValueChange={(value) => handleFilterChange('type', value)}>
                      <SelectTrigger className="border-2 border-gray-200 focus:border-gray-900 rounded-xl">
                        <SelectValue placeholder="All types" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="jobs">Jobs</SelectItem>
                        <SelectItem value="internships">Internships</SelectItem>
                        <SelectItem value="research-papers">Research Papers</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-3">
                  <Label htmlFor="status" className="text-sm font-semibold text-gray-800">Status</Label>
                  <Select value={filters.status || "all"} onValueChange={(value) => handleFilterChange('status', value === "all" ? "" : value)}>
                    <SelectTrigger className="border-2 border-gray-200 focus:border-gray-900 rounded-xl">
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Reviewed">Reviewed</SelectItem>
                      <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                      <SelectItem value="Hired">Hired</SelectItem>
                      <SelectItem value="Selected">Selected</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Needs Revision">Needs Revision</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label htmlFor="company" className="text-sm font-semibold text-gray-800">Company</Label>
                  <Input
                    id="company"
                    placeholder="Filter by company..."
                    value={filters.company}
                    onChange={(e) => handleFilterChange('company', e.target.value)}
                    className="border-2 border-gray-200 focus:border-gray-900 rounded-xl"
                  />
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mt-8 pt-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-6 py-2 rounded-xl font-medium transition-all duration-300"
                >
                  Clear All Filters
                </Button>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <TrendingUp className="h-4 w-4 text-gray-800" />
                  <span className="font-medium">{pagination.total} total applications found</span>
                </div>
              </div>
            </CardContent>
          </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="h-16 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchApplications} className="mt-4">
                Try Again
              </Button>
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">No applications found.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {applications.map((application) => {
                const highlightId = searchParams.get('highlight');
                const isHighlighted = highlightId && parseInt(highlightId) === application.Application_ID;

                return (
                <div
                  key={application.Application_ID}
                  id={`application-${application.Application_ID}`}
                  className={cn(
                    "border rounded-lg p-4 space-y-3 transition-all duration-300",
                    isHighlighted
                      ? "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{application.Applicant_Name}</span>
                      </div>
                      <Badge variant={getStatusBadgeVariant(application.Status)} className="flex items-center gap-1">
                        {getStatusIcon(application.Status)}
                        {application.Status}
                      </Badge>
                      <Badge variant="outline">
                        {application.Application_Type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleRowExpansion(application.Application_ID)}
                      >
                        {expandedRows.has(application.Application_ID) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedApplication(application);
                          setIsDetailDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center space-x-2">
                      {application.Application_Type === 'Research_Paper' ? (
                        <FileText className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Building className="h-4 w-4 text-gray-500" />
                      )}
                      <span>
                        {application.Application_Type === 'Research_Paper'
                          ? application.Position_Title
                          : `${application.Position_Title} at ${application.Company_Name}`}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>
                        {application.Application_Type === 'Research_Paper'
                          ? 'Research Submission'
                          : application.Location}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>{new Date(application.Application_Date).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {expandedRows.has(application.Application_ID) && (
                    <div className="border-t pt-3 space-y-3">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Contact Information</Label>
                          <div className="space-y-1 text-sm">
                            <div className="flex items-center space-x-2">
                              <Mail className="h-3 w-3 text-gray-500" />
                              <span>{application.Applicant_Email}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">
                            {application.Application_Type === 'Research_Paper' ? 'Research Details' : 'Resume'}
                          </Label>
                          <div className="space-y-1">
                            {application.Application_Type === 'Research_Paper' ? (
                              <div className="text-sm space-y-1">
                                {application.Authors && (
                                  <div><strong>Authors:</strong> {application.Authors}</div>
                                )}
                                {application.Keywords && (
                                  <div><strong>Keywords:</strong> {application.Keywords}</div>
                                )}
                              </div>
                            ) : (
                              application.Resume_URL && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => window.open(application.Resume_URL, '_blank')}
                                  className="flex items-center gap-2"
                                >
                                  <ExternalLink className="h-3 w-3" />
                                  View Resume
                                </Button>
                              )
                            )}
                          </div>
                        </div>
                      </div>

                      {(application.Cover_Letter || (application.Application_Type === 'Research_Paper' && application.Abstract)) && (
                        <div>
                          <Label className="text-sm font-medium">
                            {application.Application_Type === 'Research_Paper' ? 'Abstract' : 'Cover Letter'}
                          </Label>
                          <div className="mt-1 p-3 bg-gray-50 rounded text-sm">
                            {application.Application_Type === 'Research_Paper' ? application.Abstract : application.Cover_Letter}
                          </div>
                        </div>
                      )}

                      {application.Notes && (
                        <div>
                          <Label className="text-sm font-medium">Internal Notes</Label>
                          <div className="mt-1 p-3 bg-yellow-50 rounded text-sm">
                            {application.Notes}
                          </div>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 pt-2">
                        <Label className="text-sm font-medium">Update Status:</Label>
                        <Select
                          value={application.Status}
                          onValueChange={(value) => handleStatusUpdate(application.Application_ID, value)}
                        >
                          <SelectTrigger className="w-40">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Pending">Pending</SelectItem>
                            {application.Application_Type !== 'Research_Paper' && (
                              <>
                                <SelectItem value="Reviewed">Reviewed</SelectItem>
                                <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                                <SelectItem value={application.Application_Type === 'Job' ? 'Hired' : 'Selected'}>
                                  {application.Application_Type === 'Job' ? 'Hired' : 'Selected'}
                                </SelectItem>
                              </>
                            )}
                            {application.Application_Type === 'Research_Paper' && (
                              <>
                                <SelectItem value="Approved">Approved</SelectItem>
                                <SelectItem value="Needs Revision">Needs Revision</SelectItem>
                              </>
                            )}
                            <SelectItem value="Rejected">Rejected</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {pagination.total > pagination.limit && (
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-gray-600">
                Showing {pagination.offset + 1} to {Math.min(pagination.offset + pagination.limit, pagination.total)} of {pagination.total} applications
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset === 0}
                  onClick={() => setPagination(prev => ({ ...prev, offset: Math.max(0, prev.offset - prev.limit) }))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={pagination.offset + pagination.limit >= pagination.total}
                  onClick={() => setPagination(prev => ({ ...prev, offset: prev.offset + prev.limit }))}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Application Details</DialogTitle>
            <DialogDescription>
              Detailed view of the application with all information and actions.
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6">
              {/* Applicant Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Applicant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedApplication.Applicant_Name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.Applicant_Email}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Applied on {new Date(selectedApplication.Application_Date).toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Position Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedApplication.Position_Title}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.Company_Name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.Location}</span>
                    </div>
                    <Badge variant="outline" className="w-fit">
                      {selectedApplication.Application_Type} - {selectedApplication.Position_Type}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Resume */}
              {selectedApplication.Resume_URL && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      onClick={() => window.open(selectedApplication.Resume_URL, '_blank')}
                      className="flex items-center gap-2"
                    >
                      <ExternalLink className="h-4 w-4" />
                      View Resume
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Cover Letter */}
              {selectedApplication.Cover_Letter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                      {selectedApplication.Cover_Letter}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Status and Actions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Status & Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Label>Current Status:</Label>
                    <Badge variant={getStatusBadgeVariant(selectedApplication.Status)} className="flex items-center gap-1">
                      {getStatusIcon(selectedApplication.Status)}
                      {selectedApplication.Status}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-4">
                    <Label htmlFor="status-update">Update Status:</Label>
                    <Select
                      value={selectedApplication.Status}
                      onValueChange={(value) => {
                        handleStatusUpdate(selectedApplication.Application_ID, value);
                        setSelectedApplication(prev => prev ? { ...prev, Status: value } : null);
                      }}
                    >
                      <SelectTrigger className="w-48">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Reviewed">Reviewed</SelectItem>
                        <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                        <SelectItem value="Rejected">Rejected</SelectItem>
                        <SelectItem value={selectedApplication.Application_Type === 'Job' ? 'Hired' : 'Selected'}>
                          {selectedApplication.Application_Type === 'Job' ? 'Hired' : 'Selected'}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Internal Notes */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <StickyNote className="h-5 w-5" />
                    Internal Notes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApplication.Notes ? (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      {selectedApplication.Notes}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic">No internal notes yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
        </div>
      </div>
    </div>
  );
};

export default Applications;