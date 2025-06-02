import React, { useState, useEffect } from 'react';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ClipboardList, Calendar, Building, MapPin, Eye, Loader2, FileText, TrendingUp, Star, ArrowRight, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { contentApi, JobApplication, InternshipApplication } from '@/services/api';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Skeleton } from '@/components/ui/skeleton';

const Applications = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State management
  const [jobApplications, setJobApplications] = useState<JobApplication[]>([]);
  const [internshipApplications, setInternshipApplications] = useState<InternshipApplication[]>([]);
  const [researchPaperApplications, setResearchPaperApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user's applications on component mount
  useEffect(() => {
    fetchUserApplications();
  }, []);

  const fetchUserApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const [jobAppsResponse, internshipAppsResponse, researchAppsResponse] = await Promise.all([
        contentApi.getUserJobApplications(),
        contentApi.getUserInternshipApplications(),
        contentApi.getUserResearchPaperApplications(),
      ]);

      setJobApplications(jobAppsResponse.applications || []);
      setInternshipApplications(internshipAppsResponse.applications || []);
      setResearchPaperApplications(researchAppsResponse.applications || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load applications');
      toast({
        title: "Error",
        description: "Failed to load your applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under review':
        return 'bg-yellow-100 text-yellow-800';
      case 'interview scheduled':
        return 'bg-blue-100 text-blue-800';
      case 'new':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canManageApplications = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);

  // Combine all applications for display
  const allApplications = [
    ...jobApplications.map(app => ({ ...app, type: 'job' })),
    ...internshipApplications.map(app => ({ ...app, type: 'internship' })),
    ...researchPaperApplications.map(app => ({ ...app, type: 'research-paper' }))
  ].sort((a, b) => new Date(b.Application_Date).getTime() - new Date(a.Application_Date).getTime());

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>

            {/* Tabs Skeleton */}
            <div className="h-12 bg-gray-200 rounded-xl w-80 animate-pulse"></div>

            {/* Content Skeletons */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-2 border-gray-100 shadow-xl">
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4 flex-1">
                        <Skeleton className="h-12 w-12 rounded-xl" />
                        <div className="space-y-3 flex-1">
                          <Skeleton className="h-6 w-3/4" />
                          <div className="flex gap-6">
                            <Skeleton className="h-4 w-32" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </div>
                      <Skeleton className="h-6 w-24" />
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Skeleton className="h-4 w-48" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
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
                    <ClipboardList className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      My Applications
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Track and manage your career applications and submissions
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{allApplications.length} Total Applications</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">
                      {allApplications.length > 0 ? `Latest: ${format(new Date(allApplications[0].Application_Date), 'MMM dd')}` : 'No applications yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <Tabs defaultValue="my-applications" className="space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl">
              <div className="flex justify-center">
                <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="my-applications"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <ClipboardList className="h-4 w-4" />
                    My Applications ({allApplications.length})
                  </TabsTrigger>
                  {canManageApplications && (
                    <TabsTrigger
                      value="received-applications"
                      className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                    >
                      <Star className="h-4 w-4" />
                      Received Applications
                    </TabsTrigger>
                  )}
                </TabsList>
              </div>
            </div>

            <TabsContent value="my-applications" className="space-y-6">
              {allApplications.length === 0 ? (
                <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="text-center py-16">
                    <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                      <ClipboardList className="h-16 w-16 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3 modern-heading">No Applications Yet</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      You haven't applied to any jobs or internships yet. Start browsing opportunities to launch your legal career!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                allApplications.map((application) => (
                  <Card key={`${application.type}-${application.Application_ID}`} className="group border-2 border-gray-100  shadow-xl hover:shadow-2xl transition-all duration-500 bg-white hover:-translate-y-1 transform-gpu">
                    <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4 flex-1">
                          <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                            {application.type === 'job' ? (
                              <Building className="h-6 w-6 text-gray-800" />
                            ) : application.type === 'internship' ? (
                              <ClipboardList className="h-6 w-6 text-gray-800" />
                            ) : (
                              <FileText className="h-6 w-6 text-gray-800" />
                            )}
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-xl modern-heading group-hover:text-gray-900 mb-2">
                              {application.type === 'job' ? application.Job_Title :
                               application.type === 'internship' ? application.Internship_Title :
                               application.Title}
                            </CardTitle>
                            <div className="flex flex-wrap items-center gap-4 text-gray-600">
                              {application.type !== 'research-paper' && (
                                <>
                                  <span className="flex items-center gap-2 font-medium">
                                    <Building className="h-4 w-4 text-gray-800" />
                                    {application.Company_Name}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-gray-800" />
                                    {application.Location}
                                  </span>
                                </>
                              )}
                              {application.type === 'research-paper' && (
                                <span className="flex items-center gap-2 font-medium">
                                  <FileText className="h-4 w-4 text-gray-800" />
                                  Research Paper Submission
                                </span>
                              )}
                              <Badge variant="outline" className="border-gray-800 text-gray-800 bg-gray-50">
                                {application.type === 'job' ? application.Job_Type :
                                 application.type === 'internship' ? application.Internship_Type :
                                 'Research Paper'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {(application.type === 'research-paper' ? application.Display_Status : application.Status) === 'Under Review' && (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                          {(application.type === 'research-paper' ? application.Display_Status : application.Status) === 'Approved' && (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          )}
                          {(application.type === 'research-paper' ? application.Display_Status : application.Status) === 'Rejected' && (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                          <Badge className={cn(
                            "px-3 py-1 text-xs font-bold rounded-lg",
                            getStatusColor(application.type === 'research-paper' ? application.Display_Status : application.Status)
                          )}>
                            {application.type === 'research-paper' ? application.Display_Status : application.Status}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-gray-600">
                          <Calendar className="h-4 w-4 text-gray-800" />
                          <span className="font-medium">
                            Applied: {format(new Date(application.Application_Date), 'MMM dd, yyyy')}
                          </span>
                        </div>
                        <Button
                          asChild
                          className="bg-black hover:bg-gray-800 text-white px-4 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                        >
                          <a href={`#view-${application.type}-${application.Application_ID}`}>
                            View Details
                            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                          </a>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </TabsContent>

            {canManageApplications && (
              <TabsContent value="received-applications" className="space-y-6">
                <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                  <CardContent className="text-center py-16">
                    <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                      <Star className="h-16 w-16 text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-black mb-3 modern-heading">Application Management</h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                      To manage applications for your job and internship postings, please visit the dedicated Application Management page.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="bg-black hover:bg-gray-800 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group"
                    >
                      <a href="/manage-applications">
                        Go to Application Management
                        <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default Applications;
