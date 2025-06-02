import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Search,
  Filter,
  Eye,
  Download,
  Calendar,
  User,
  Briefcase,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  MessageSquare,
  Mail,
  Phone,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { jobApi } from '@/services/api';

interface Application {
  application_id: number;
  job_id: number;
  internship_id: number;
  user_id: number;
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  position_title: string;
  company_name: string;
  application_type: 'Job' | 'Internship' | 'Research_Paper';
  status: 'Pending' | 'Under_Review' | 'Accepted' | 'Rejected';
  applied_at: string;
  resume_url?: string;
  cover_letter?: string;
  custom_responses?: { question: string; answer: string }[];
  admin_notes?: string;
  reviewed_by?: string;
  reviewed_at?: string;
}

interface ApplicationFilters {
  search: string;
  status: string;
  type: string;
  dateFrom: string;
  dateTo: string;
  company: string;
}

const ApplicationManagement = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [isStatusUpdateDialogOpen, setIsStatusUpdateDialogOpen] = useState(false);
  const [statusUpdateForm, setStatusUpdateForm] = useState({
    status: '',
    notes: '',
  });
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const [filters, setFilters] = useState<ApplicationFilters>({
    search: '',
    status: 'all',
    type: 'all',
    dateFrom: '',
    dateTo: '',
    company: '',
  });

  useEffect(() => {
    fetchApplications();
  }, [filters]);

  const fetchApplications = async () => {
    try {
      setLoading(true);

      // For now, use dummy data since backend endpoints need to be implemented
      const dummyApplications: Application[] = [
        {
          application_id: 1,
          job_id: 1,
          internship_id: 0,
          user_id: 3,
          applicant_name: 'John Smith',
          applicant_email: 'john.smith@email.com',
          applicant_phone: '+1-555-0123',
          position_title: 'Senior Legal Associate',
          company_name: 'Smith & Associates Law Firm',
          application_type: 'Job',
          status: 'Pending',
          applied_at: '2024-01-15T10:30:00Z',
          resume_url: '/uploads/resumes/john_smith_resume.pdf',
          cover_letter: 'I am writing to express my strong interest in the Senior Legal Associate position...',
          custom_responses: [
            { question: 'Why are you interested in this position?', answer: 'I have always been passionate about corporate law...' },
            { question: 'What is your experience with contract law?', answer: 'I have 5 years of experience in contract negotiation...' }
          ],
        },
        {
          application_id: 2,
          job_id: 0,
          internship_id: 1,
          user_id: 4,
          applicant_name: 'Sarah Johnson',
          applicant_email: 'sarah.johnson@email.com',
          applicant_phone: '+1-555-0456',
          position_title: 'Legal Research Intern',
          company_name: 'Johnson Legal Group',
          application_type: 'Internship',
          status: 'Under_Review',
          applied_at: '2024-01-14T14:20:00Z',
          resume_url: '/uploads/resumes/sarah_johnson_resume.pdf',
          cover_letter: 'As a law student with a strong academic background...',
          custom_responses: [
            { question: 'What areas of law interest you most?', answer: 'I am particularly interested in intellectual property law...' }
          ],
          admin_notes: 'Strong candidate with excellent academic record.',
          reviewed_by: 'Admin User',
          reviewed_at: '2024-01-15T09:00:00Z',
        },
        {
          application_id: 3,
          job_id: 0,
          internship_id: 0,
          user_id: 5,
          applicant_name: 'Michael Chen',
          applicant_email: 'michael.chen@email.com',
          applicant_phone: '+1-555-0789',
          position_title: 'Research Paper: AI in Legal Practice',
          company_name: 'LawFort Research',
          application_type: 'Research_Paper',
          status: 'Accepted',
          applied_at: '2024-01-10T16:45:00Z',
          custom_responses: [
            { question: 'Describe your research methodology', answer: 'I plan to conduct a comprehensive analysis of AI applications...' }
          ],
          admin_notes: 'Excellent research proposal. Approved for publication.',
          reviewed_by: 'Dr. Emily Davis',
          reviewed_at: '2024-01-12T11:30:00Z',
        },
      ];

      // Apply filters
      let filteredApplications = dummyApplications;

      if (filters.search) {
        filteredApplications = filteredApplications.filter(app =>
          app.applicant_name.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.position_title.toLowerCase().includes(filters.search.toLowerCase()) ||
          app.company_name.toLowerCase().includes(filters.search.toLowerCase())
        );
      }

      if (filters.status !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.status === filters.status);
      }

      if (filters.type !== 'all') {
        filteredApplications = filteredApplications.filter(app => app.application_type === filters.type);
      }

      if (filters.company) {
        filteredApplications = filteredApplications.filter(app =>
          app.company_name.toLowerCase().includes(filters.company.toLowerCase())
        );
      }

      if (filters.dateFrom) {
        filteredApplications = filteredApplications.filter(app =>
          new Date(app.applied_at) >= new Date(filters.dateFrom)
        );
      }

      if (filters.dateTo) {
        filteredApplications = filteredApplications.filter(app =>
          new Date(app.applied_at) <= new Date(filters.dateTo)
        );
      }

      setApplications(filteredApplications);
    } catch (error) {
      console.error('Error fetching applications:', error);
      toast({
        title: "Error",
        description: "Failed to load applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (application: Application) => {
    setSelectedApplication(application);
    setIsDetailDialogOpen(true);
  };

  const handleStatusUpdate = (application: Application) => {
    setSelectedApplication(application);
    setStatusUpdateForm({
      status: application.status,
      notes: application.admin_notes || '',
    });
    setIsStatusUpdateDialogOpen(true);
  };

  const handleSaveStatusUpdate = async () => {
    if (!selectedApplication) return;

    try {
      setUpdatingStatus(true);

      // For now, just update locally
      // In a real implementation, you would call an API endpoint
      setApplications(prev => prev.map(app =>
        app.application_id === selectedApplication.application_id
          ? {
              ...app,
              status: statusUpdateForm.status as Application['status'],
              admin_notes: statusUpdateForm.notes,
              reviewed_by: user?.full_name || user?.email || 'Admin',
              reviewed_at: new Date().toISOString(),
            }
          : app
      ));

      toast({
        title: "Status updated",
        description: "Application status has been updated successfully.",
      });

      setIsStatusUpdateDialogOpen(false);
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Clock className="h-4 w-4" />;
      case 'Under_Review':
        return <AlertCircle className="h-4 w-4" />;
      case 'Accepted':
        return <CheckCircle className="h-4 w-4" />;
      case 'Rejected':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Under_Review':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Accepted':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'Rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const exportApplications = () => {
    // Create CSV data
    const csvData = applications.map(app => ({
      'Application ID': app.application_id,
      'Applicant Name': app.applicant_name,
      'Email': app.applicant_email,
      'Phone': app.applicant_phone,
      'Position': app.position_title,
      'Company': app.company_name,
      'Type': app.application_type,
      'Status': app.status,
      'Applied Date': new Date(app.applied_at).toLocaleDateString(),
      'Reviewed By': app.reviewed_by || 'Not reviewed',
      'Admin Notes': app.admin_notes || 'No notes',
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applications-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Applications data has been exported to CSV.",
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading applications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Application Management</h2>
          <p className="text-gray-600">Manage job, internship, and research paper applications</p>
        </div>
        <Button onClick={exportApplications} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search applications..."
                  value={filters.search}
                  onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={filters.status} onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Under_Review">Under Review</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={filters.type} onValueChange={(value) => setFilters(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="Job">Jobs</SelectItem>
                  <SelectItem value="Internship">Internships</SelectItem>
                  <SelectItem value="Research_Paper">Research Papers</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                placeholder="Filter by company..."
                value={filters.company}
                onChange={(e) => setFilters(prev => ({ ...prev, company: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateFrom">From Date</Label>
              <Input
                id="dateFrom"
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dateTo">To Date</Label>
              <Input
                id="dateTo"
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Applications Table */}
      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
          <CardDescription>
            {applications.length === 0 ? 'No applications found' : `Showing ${applications.length} applications`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {applications.length === 0 ? (
            <div className="text-center py-8">
              <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No applications found</h3>
              <p className="text-muted-foreground">
                No applications match your current filters.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Applicant</TableHead>
                    <TableHead>Position</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied Date</TableHead>
                    <TableHead>Reviewed By</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.application_id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.applicant_name}</div>
                          <div className="text-sm text-gray-500">{application.applicant_email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{application.position_title}</div>
                          <div className="text-sm text-gray-500">{application.company_name}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {application.application_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(application.status)}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(application.status)}
                            {application.status.replace('_', ' ')}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>{formatDate(application.applied_at)}</TableCell>
                      <TableCell>
                        {application.reviewed_by ? (
                          <div>
                            <div className="text-sm">{application.reviewed_by}</div>
                            <div className="text-xs text-gray-500">
                              {application.reviewed_at ? formatDate(application.reviewed_at) : ''}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">Not reviewed</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewDetails(application)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleStatusUpdate(application)}
                          >
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Application Details Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Application Details
            </DialogTitle>
            <DialogDescription>
              Detailed view of {selectedApplication?.applicant_name}'s application
            </DialogDescription>
          </DialogHeader>

          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Applicant Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedApplication.applicant_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.applicant_email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <span>{selectedApplication.applicant_phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span>Applied: {formatDate(selectedApplication.applied_at)}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Position Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4 text-gray-500" />
                      <span className="font-medium">{selectedApplication.position_title}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Company:</span>
                      <span>{selectedApplication.company_name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Type:</span>
                      <Badge variant="outline">
                        {selectedApplication.application_type.replace('_', ' ')}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">Status:</span>
                      <Badge className={getStatusColor(selectedApplication.status)}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(selectedApplication.status)}
                          {selectedApplication.status.replace('_', ' ')}
                        </div>
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cover Letter */}
              {selectedApplication.cover_letter && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Cover Letter</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Custom Responses */}
              {selectedApplication.custom_responses && selectedApplication.custom_responses.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Application Questions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedApplication.custom_responses.map((response, index) => (
                        <div key={index} className="border-l-4 border-blue-500 pl-4">
                          <h4 className="font-medium text-gray-900 mb-2">{response.question}</h4>
                          <p className="text-gray-700 bg-gray-50 p-3 rounded">{response.answer}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Resume */}
              {selectedApplication.resume_url && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resume</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4">
                      <FileText className="h-8 w-8 text-blue-500" />
                      <div>
                        <p className="font-medium">Resume.pdf</p>
                        <p className="text-sm text-gray-500">Click to download or view</p>
                      </div>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Admin Notes */}
              {selectedApplication.admin_notes && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Admin Notes</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                      <p>{selectedApplication.admin_notes}</p>
                      {selectedApplication.reviewed_by && (
                        <div className="mt-2 text-sm text-gray-600">
                          <span>Reviewed by: {selectedApplication.reviewed_by}</span>
                          {selectedApplication.reviewed_at && (
                            <span> on {formatDate(selectedApplication.reviewed_at)}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsDetailDialogOpen(false);
              if (selectedApplication) {
                handleStatusUpdate(selectedApplication);
              }
            }}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Status Update Dialog */}
      <Dialog open={isStatusUpdateDialogOpen} onOpenChange={setIsStatusUpdateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Update Application Status
            </DialogTitle>
            <DialogDescription>
              Update the status and add notes for {selectedApplication?.applicant_name}'s application
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={statusUpdateForm.status}
                onValueChange={(value) => setStatusUpdateForm(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Under_Review">Under Review</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Admin Notes</Label>
              <Textarea
                id="notes"
                value={statusUpdateForm.notes}
                onChange={(e) => setStatusUpdateForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Add notes about this application..."
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusUpdateDialogOpen(false)}
              disabled={updatingStatus}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveStatusUpdate} disabled={updatingStatus}>
              {updatingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationManagement;
