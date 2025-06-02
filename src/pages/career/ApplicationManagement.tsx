import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Briefcase,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  Mail,
  Phone,
  ExternalLink,
} from 'lucide-react';
import { contentApi, JobApplication, InternshipApplication } from '@/services/api';

const ApplicationManagement = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [internshipApplications, setInternshipApplications] = useState<InternshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<JobApplication | InternshipApplication | null>(null);
  const [statusUpdateDialog, setStatusUpdateDialog] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [notes, setNotes] = useState('');

  // Check if user has permission to manage applications
  const canManageApplications = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);

  useEffect(() => {
    if (!canManageApplications) return;

    const fetchApplications = async () => {
      try {
        setLoading(true);
        
        const [jobAppsResponse, internshipAppsResponse] = await Promise.all([
          contentApi.getEditorJobApplications(),
          contentApi.getEditorInternshipApplications(),
        ]);

        setJobApplications(jobAppsResponse.applications || []);
        setInternshipApplications(internshipAppsResponse.applications || []);
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

    fetchApplications();
  }, [canManageApplications, toast]);

  const handleStatusUpdate = async () => {
    if (!selectedApplication || !newStatus) return;

    try {
      const isJobApplication = 'Job_ID' in selectedApplication;
      
      if (isJobApplication) {
        await contentApi.updateJobApplicationStatus(selectedApplication.Application_ID, {
          status: newStatus,
          notes,
        });
      } else {
        await contentApi.updateInternshipApplicationStatus(selectedApplication.Application_ID, {
          status: newStatus,
          notes,
        });
      }

      // Update local state
      if (isJobApplication) {
        setJobApplications(prev => 
          prev.map(app => 
            app.Application_ID === selectedApplication.Application_ID 
              ? { ...app, Status: newStatus }
              : app
          )
        );
      } else {
        setInternshipApplications(prev => 
          prev.map(app => 
            app.Application_ID === selectedApplication.Application_ID 
              ? { ...app, Status: newStatus }
              : app
          )
        );
      }

      toast({
        title: "Success",
        description: "Application status updated successfully.",
      });

      setStatusUpdateDialog(false);
      setSelectedApplication(null);
      setNewStatus('');
      setNotes('');
    } catch (error) {
      console.error('Error updating application status:', error);
      toast({
        title: "Error",
        description: "Failed to update application status.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'reviewed':
        return <Badge variant="secondary"><Eye className="h-3 w-3 mr-1" />Reviewed</Badge>;
      case 'accepted':
        return <Badge variant="default"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>;
      case 'rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const ApplicationCard = ({ application, type }: { application: JobApplication | InternshipApplication; type: 'job' | 'internship' }) => {
    const title = type === 'job' ? (application as JobApplication).Job_Title : (application as InternshipApplication).Internship_Title;
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-lg">{title}</CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {application.Company_Name} • {application.Location}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Applied: {new Date(application.Application_Date).toLocaleDateString()}
              </p>
            </div>
            <div className="flex flex-col items-end gap-2">
              {getStatusBadge(application.Status)}
              <Badge variant="outline">
                {type === 'job' ? (application as JobApplication).Job_Type : (application as InternshipApplication).Internship_Type}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {application.Applicant_Name}
              </span>
              <span className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {application.Applicant_Email}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              {application.Resume_URL && (
                <Button size="sm" variant="outline" asChild>
                  <a href={application.Resume_URL} target="_blank" rel="noopener noreferrer">
                    <FileText className="h-4 w-4 mr-1" />
                    Resume
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
              
              <Dialog>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline">
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Application Details</DialogTitle>
                    <DialogDescription>
                      Application for {title} at {application.Company_Name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Applicant</Label>
                      <p className="text-sm">{application.Applicant_Name} ({application.Applicant_Email})</p>
                    </div>
                    <div>
                      <Label>Application Date</Label>
                      <p className="text-sm">{new Date(application.Application_Date).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <Label>Status</Label>
                      <div className="mt-1">{getStatusBadge(application.Status)}</div>
                    </div>
                    {application.Cover_Letter && (
                      <div>
                        <Label>Cover Letter</Label>
                        <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm">
                          {application.Cover_Letter}
                        </div>
                      </div>
                    )}
                  </div>
                </DialogContent>
              </Dialog>

              <Button 
                size="sm" 
                onClick={() => {
                  setSelectedApplication(application);
                  setNewStatus(application.Status);
                  setStatusUpdateDialog(true);
                }}
              >
                Update Status
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (!canManageApplications) {
    return (
      <div className="text-center py-12">
        <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Access Denied</h3>
        <p className="text-gray-600">You need Editor or Admin permissions to manage applications.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Application Management</h1>
        <p className="text-gray-600 mt-2">Manage applications for your job and internship postings</p>
      </div>

      <Tabs defaultValue="jobs" className="space-y-6">
        <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-center">
            <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
              <TabsTrigger
                value="jobs"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Briefcase className="h-4 w-4" />
                Job Applications ({jobApplications.length})
              </TabsTrigger>
              <TabsTrigger
                value="internships"
                className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
              >
                <Users className="h-4 w-4" />
                Internship Applications ({internshipApplications.length})
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <TabsContent value="jobs">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : jobApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No job applications</h3>
                <p className="text-gray-600">Applications for your job postings will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {jobApplications.map((application) => (
                <ApplicationCard 
                  key={application.Application_ID} 
                  application={application} 
                  type="job" 
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="internships">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Card key={i}>
                  <CardHeader>
                    <Skeleton className="h-6 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </CardHeader>
                  <CardContent>
                    <Skeleton className="h-4 w-full mb-2" />
                    <Skeleton className="h-4 w-2/3" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : internshipApplications.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No internship applications</h3>
                <p className="text-gray-600">Applications for your internship postings will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {internshipApplications.map((application) => (
                <ApplicationCard 
                  key={application.Application_ID} 
                  application={application} 
                  type="internship" 
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Status Update Dialog */}
      <Dialog open={statusUpdateDialog} onOpenChange={setStatusUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Application Status</DialogTitle>
            <DialogDescription>
              Change the status of this application and add optional notes.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Reviewed">Reviewed</SelectItem>
                  <SelectItem value="Accepted">Accepted</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this application..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusUpdateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleStatusUpdate} disabled={!newStatus}>
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApplicationManagement;
