import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  ArrowLeft,
  MapPin,
  Clock,
  DollarSign,
  Building,
  Calendar,
  Users,
  Bookmark,
  Share2,
  Edit,
  Trash2,
  Upload,
  CheckCircle,
} from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { contentApi, userApi, Job } from '@/services/api';

const JobDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  // State management
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [applicationData, setApplicationData] = useState<any>(null);
  const [isApplying, setIsApplying] = useState(false);
  const [isApplicationDialogOpen, setIsApplicationDialogOpen] = useState(false);

  // Application form state
  const [resumeUrl, setResumeUrl] = useState('');
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeOption, setResumeOption] = useState<'url' | 'file'>('url');
  const [isUploading, setIsUploading] = useState(false);

  // Bookmark/Save state
  const [isSaved, setIsSaved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Permission checks
  const canEdit = user && job && (
    hasPermission(Permission.CONTENT_UPDATE_ALL) ||
    (hasPermission(Permission.CONTENT_UPDATE_OWN) && job.user_id?.toString() === user.id)
  );
  const canDelete = user && hasPermission(Permission.CONTENT_DELETE_ALL);
  const canApply = user && hasPermission(Permission.JOB_APPLY);

  // Fetch job data on component mount
  useEffect(() => {
    if (id) {
      fetchJobData(parseInt(id));
    }
  }, [id]);

  const fetchJobData = async (jobId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await contentApi.getJob(jobId);
      if (response.success) {
        setJob(response.job);
        setHasApplied(response.has_applied || false);
        setApplicationData(response.application || null);

        // Check if job is saved to user's library
        if (user) {
          try {
            const savedContent = await userApi.getSavedContent({ content_type: 'Job' });
            const isJobSaved = savedContent.saved_content.some(
              (item: any) => item.content_id === response.job.content_id
            );
            setIsSaved(isJobSaved);
          } catch (error) {
            // Ignore error for saved content check
            console.log('Could not check saved status:', error);
          }
        }
      } else {
        setError('Job not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load job details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteJob = async () => {
    if (!canDelete || !job) return;

    if (!confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteJob(job.content_id);
      toast({
        title: "Success",
        description: "Job posting deleted successfully.",
      });
      navigate('/jobs');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete job posting. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      setIsUploading(true);
      const response = await fetch('http://localhost:5000/api/upload/resume', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload file');
      }

      const data = await response.json();
      return data.file_url;
    } catch (error) {
      throw new Error('Failed to upload resume file');
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    setResumeFile(file);
  };

  const handleApplyForJob = async () => {
    if (!job || !canApply) return;

    // Validate resume input based on selected option
    if (resumeOption === 'url' && !resumeUrl.trim()) {
      toast({
        title: "Error",
        description: "Please provide a resume URL.",
        variant: "destructive",
      });
      return;
    }

    if (resumeOption === 'file' && !resumeFile) {
      toast({
        title: "Error",
        description: "Please select a resume file to upload.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsApplying(true);

      let finalResumeUrl = resumeUrl.trim();

      // If file option is selected, upload the file first
      if (resumeOption === 'file' && resumeFile) {
        finalResumeUrl = await handleFileUpload(resumeFile);
      }

      const response = await contentApi.applyForJob(job.job_id, {
        resume_url: finalResumeUrl,
        cover_letter: coverLetter.trim() || undefined,
      });

      toast({
        title: "Application Submitted",
        description: "Your application has been submitted successfully!",
      });

      // Update state to reflect application
      setHasApplied(true);
      setIsApplicationDialogOpen(false);
      setResumeUrl('');
      setCoverLetter('');
      setResumeFile(null);

      // Refresh job data to get updated application count
      fetchJobData(job.job_id);
    } catch (error: any) {
      toast({
        title: "Application Failed",
        description: error.message || "Failed to submit application. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsApplying(false);
    }
  };

  const handleSaveJob = async () => {
    if (!job || !user) return;

    try {
      setIsSaving(true);

      if (isSaved) {
        // Unsave the job
        await userApi.unsaveContent(job.content_id);
        setIsSaved(false);
        toast({
          title: "Removed from Library",
          description: "Job posting removed from your personal library.",
        });
      } else {
        // Save the job
        await userApi.saveContent({ content_id: job.content_id });
        setIsSaved(true);
        toast({
          title: "Saved to Library",
          description: "Job posting saved to your personal library.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update saved status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleShareJob = async () => {
    if (!job) return;

    const shareData = {
      title: job.title,
      text: `Check out this job opportunity: ${job.title} at ${job.company_name}`,
      url: window.location.href,
    };

    try {
      // Try to use native Web Share API if available
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
      } else {
        // Fallback to copying URL to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link Copied",
          description: "Job posting link copied to clipboard.",
        });
      }
    } catch (error) {
      // If clipboard API fails, show the URL in a toast
      toast({
        title: "Share Job",
        description: `Copy this link: ${window.location.href}`,
      });
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !job) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/jobs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Jobs
          </Link>
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Job Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The job posting you are looking for does not exist.'}
            </p>
            <Button asChild>
              <Link to="/jobs">Browse All Jobs</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back Button */}
      <Button variant="ghost" asChild>
        <Link to="/jobs" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Jobs
        </Link>
      </Button>

      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-2">{job.title}</CardTitle>
              <div className="flex items-center gap-4 text-gray-600 mb-4">
                <span className="flex items-center gap-1">
                  <Building className="h-4 w-4" />
                  {job.company_name}
                </span>
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {job.location}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {job.job_type}
                </span>
                {job.job_type === 'Remote' && (
                  <Badge variant="secondary">Remote</Badge>
                )}
              </div>
              {job.salary_range && (
                <div className="flex items-center gap-1 text-green-600 font-medium text-lg">
                  <DollarSign className="h-5 w-5" />
                  {job.salary_range}
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveJob}
                disabled={isSaving || !user}
                className={isSaved ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareJob}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/jobs/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              {canDelete && (
                <Button variant="destructive" size="sm" onClick={handleDeleteJob}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}

              {/* Application Button */}
              {canApply && !hasApplied ? (
                <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      Apply Now
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Apply for {job.title}</DialogTitle>
                      <DialogDescription>
                        Submit your application for this position. Please provide your resume and an optional cover letter.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {/* Resume Upload Options */}
                      <div className="space-y-3">
                        <Label>Resume Submission *</Label>
                        <RadioGroup
                          value={resumeOption}
                          onValueChange={(value: 'url' | 'file') => setResumeOption(value)}
                          className="flex gap-6"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="url" id="resume-url-option" />
                            <Label htmlFor="resume-url-option">Provide URL</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="file" id="resume-file-option" />
                            <Label htmlFor="resume-file-option">Upload File</Label>
                          </div>
                        </RadioGroup>

                        {resumeOption === 'url' ? (
                          <div className="space-y-2">
                            <Input
                              id="resume-url"
                              placeholder="https://example.com/your-resume.pdf"
                              value={resumeUrl}
                              onChange={(e) => setResumeUrl(e.target.value)}
                            />
                            <p className="text-xs text-gray-500">
                              Please provide a direct link to your resume (PDF, Google Drive, etc.)
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Input
                              id="resume-file"
                              type="file"
                              accept=".pdf"
                              onChange={handleFileChange}
                              disabled={isUploading}
                            />
                            <p className="text-xs text-gray-500">
                              Upload a PDF file (max 5MB). {resumeFile && `Selected: ${resumeFile.name}`}
                            </p>
                            {isUploading && (
                              <p className="text-xs text-blue-600">Uploading file...</p>
                            )}
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
                        <Textarea
                          id="cover-letter"
                          placeholder="Write a brief cover letter..."
                          value={coverLetter}
                          onChange={(e) => setCoverLetter(e.target.value)}
                          rows={4}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => setIsApplicationDialogOpen(false)}
                          disabled={isApplying}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handleApplyForJob}
                          disabled={
                            isApplying ||
                            isUploading ||
                            (resumeOption === 'url' && !resumeUrl.trim()) ||
                            (resumeOption === 'file' && !resumeFile)
                          }
                          className="flex-1"
                        >
                          {isApplying ? (
                            <>
                              <Upload className="h-4 w-4 mr-2 animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Submit Application
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              ) : hasApplied ? (
                <Button size="lg" disabled className="bg-green-600">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Applied
                </Button>
              ) : (
                <Button size="lg" disabled>
                  Login to Apply
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm text-gray-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Posted {new Date(job.created_at).toLocaleDateString()}
              </span>
              {job.application_deadline && (
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Deadline: {new Date(job.application_deadline).toLocaleDateString()}
                </span>
              )}
            </div>
            {job.experience_required && (
              <span>Experience: {job.experience_required}</span>
            )}
          </div>

          {job.tags && (
            <div className="flex flex-wrap gap-2 mt-4">
              {job.tags.split(',').map((tag, index) => (
                <Badge key={index} variant="outline">
                  {tag.trim()}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Job Description */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Job Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none">
                {job.summary && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Summary</h4>
                    <p className="text-gray-700">{job.summary}</p>
                  </div>
                )}

                <div className="mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">Job Description</h4>
                  <div
                    className="text-gray-700"
                    dangerouslySetInnerHTML={{ __html: job.content }}
                  />
                </div>

                {job.eligibility_criteria && (
                  <div className="mb-4">
                    <h4 className="font-semibold text-gray-900 mb-2">Eligibility Criteria</h4>
                    <div
                      className="text-gray-700"
                      dangerouslySetInnerHTML={{ __html: job.eligibility_criteria }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Company Info & Apply */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>About {job.company_name}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="font-medium">Company:</span>
                  <span className="ml-2 text-gray-600">{job.company_name}</span>
                </div>
                <div>
                  <span className="font-medium">Location:</span>
                  <span className="ml-2 text-gray-600">{job.location}</span>
                </div>
                <div>
                  <span className="font-medium">Job Type:</span>
                  <span className="ml-2 text-gray-600">{job.job_type}</span>
                </div>
                {job.salary_range && (
                  <div>
                    <span className="font-medium">Salary:</span>
                    <span className="ml-2 text-gray-600">{job.salary_range}</span>
                  </div>
                )}
                {job.experience_required && (
                  <div>
                    <span className="font-medium">Experience:</span>
                    <span className="ml-2 text-gray-600">{job.experience_required}</span>
                  </div>
                )}
                {job.contact_email && (
                  <div>
                    <span className="font-medium">Contact:</span>
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="ml-2 text-primary hover:underline"
                    >
                      {job.contact_email}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className={`flex-1 ${isSaved ? "bg-blue-50 border-blue-200 text-blue-700" : ""}`}
                  onClick={handleSaveJob}
                  disabled={isSaving || !user}
                >
                  <Bookmark className={`h-4 w-4 mr-2 ${isSaved ? "fill-current" : ""}`} />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleShareJob}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apply for this position</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  Ready to take the next step in your legal career?
                </p>

                {/* Application Button */}
                {canApply && !hasApplied ? (
                  <Dialog open={isApplicationDialogOpen} onOpenChange={setIsApplicationDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="w-full" size="lg">
                        Apply Now
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Apply for {job.title}</DialogTitle>
                        <DialogDescription>
                          Submit your application for this position. Please provide your resume and an optional cover letter.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        {/* Resume Upload Options */}
                        <div className="space-y-3">
                          <Label>Resume Submission *</Label>
                          <RadioGroup
                            value={resumeOption}
                            onValueChange={(value: 'url' | 'file') => setResumeOption(value)}
                            className="flex gap-6"
                          >
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="url" id="resume-url-option-sidebar" />
                              <Label htmlFor="resume-url-option-sidebar">Provide URL</Label>
                            </div>
                            <div className="flex items-center space-x-2">
                              <RadioGroupItem value="file" id="resume-file-option-sidebar" />
                              <Label htmlFor="resume-file-option-sidebar">Upload File</Label>
                            </div>
                          </RadioGroup>

                          {resumeOption === 'url' ? (
                            <div className="space-y-2">
                              <Input
                                id="resume-url-sidebar"
                                placeholder="https://example.com/your-resume.pdf"
                                value={resumeUrl}
                                onChange={(e) => setResumeUrl(e.target.value)}
                              />
                              <p className="text-xs text-gray-500">
                                Please provide a direct link to your resume (PDF, Google Drive, etc.)
                              </p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Input
                                id="resume-file-sidebar"
                                type="file"
                                accept=".pdf"
                                onChange={handleFileChange}
                                disabled={isUploading}
                              />
                              <p className="text-xs text-gray-500">
                                Upload a PDF file (max 5MB). {resumeFile && `Selected: ${resumeFile.name}`}
                              </p>
                              {isUploading && (
                                <p className="text-xs text-blue-600">Uploading file...</p>
                              )}
                            </div>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cover-letter-sidebar">Cover Letter (Optional)</Label>
                          <Textarea
                            id="cover-letter-sidebar"
                            placeholder="Write a brief cover letter..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            rows={4}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsApplicationDialogOpen(false)}
                            disabled={isApplying}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleApplyForJob}
                            disabled={
                              isApplying ||
                              isUploading ||
                              (resumeOption === 'url' && !resumeUrl.trim()) ||
                              (resumeOption === 'file' && !resumeFile)
                            }
                            className="flex-1"
                          >
                            {isApplying ? (
                              <>
                                <Upload className="h-4 w-4 mr-2 animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Upload className="h-4 w-4 mr-2" />
                                Submit Application
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                ) : hasApplied ? (
                  <Button className="w-full bg-green-600" size="lg" disabled>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button className="w-full" size="lg" disabled>
                    Login to Apply
                  </Button>
                )}

                <p className="text-xs text-gray-500 text-center">
                  By applying, you agree to our terms and conditions
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default JobDetail;
