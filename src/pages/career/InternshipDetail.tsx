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
import { ArrowLeft, MapPin, Clock, Calendar, Building, Users, Edit, Trash2, Bookmark, Share2, Upload, CheckCircle } from 'lucide-react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { contentApi, userApi, Internship } from '@/services/api';

const InternshipDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  // State management
  const [internship, setInternship] = useState<Internship | null>(null);
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
  const canEdit = user && internship && (
    hasPermission(Permission.CONTENT_UPDATE_ALL) ||
    (hasPermission(Permission.CONTENT_UPDATE_OWN) && internship.user_id?.toString() === user.id)
  );
  const canDelete = user && hasPermission(Permission.CONTENT_DELETE_ALL);
  const canApply = user && hasPermission(Permission.INTERNSHIP_APPLY);

  // Fetch internship data on component mount
  useEffect(() => {
    if (id) {
      fetchInternshipData(parseInt(id));
    }
  }, [id]);

  const fetchInternshipData = async (internshipId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await contentApi.getInternship(internshipId);
      if (response.success) {
        setInternship(response.internship);
        setHasApplied(response.has_applied || false);
        setApplicationData(response.application || null);

        // Check if internship is saved to user's library
        if (user) {
          try {
            const savedContent = await userApi.getSavedContent({ content_type: 'Internship' });
            const isInternshipSaved = savedContent.saved_content.some(
              (item: any) => item.content_id === response.internship.content_id
            );
            setIsSaved(isInternshipSaved);
          } catch (error) {
            // Ignore error for saved content check
            console.log('Could not check saved status:', error);
          }
        }
      } else {
        setError('Internship not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load internship details');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteInternship = async () => {
    if (!canDelete || !internship) return;

    if (!confirm('Are you sure you want to delete this internship posting? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteInternship(internship.content_id);
      toast({
        title: "Success",
        description: "Internship posting deleted successfully.",
      });
      navigate('/internships');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete internship posting. Please try again.",
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

  const handleApplyForInternship = async () => {
    if (!internship || !canApply) return;

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

      const response = await contentApi.applyForInternship(internship.internship_id, {
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

      // Refresh internship data to get updated application count
      fetchInternshipData(internship.internship_id);
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

  const handleSaveInternship = async () => {
    if (!internship || !user) return;

    try {
      setIsSaving(true);

      if (isSaved) {
        // Unsave the internship
        await userApi.unsaveContent(internship.content_id);
        setIsSaved(false);
        toast({
          title: "Removed from Library",
          description: "Internship posting removed from your personal library.",
        });
      } else {
        // Save the internship
        await userApi.saveContent({ content_id: internship.content_id });
        setIsSaved(true);
        toast({
          title: "Saved to Library",
          description: "Internship posting saved to your personal library.",
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

  const handleShareInternship = async () => {
    if (!internship) return;

    const shareData = {
      title: internship.title,
      text: `Check out this internship opportunity: ${internship.title} at ${internship.company_name}`,
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
          description: "Internship posting link copied to clipboard.",
        });
      }
    } catch (error) {
      // If clipboard API fails, show the URL in a toast
      toast({
        title: "Share Internship",
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
  if (error || !internship) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/internships" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Internships
          </Link>
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Internship Not Found</h2>
            <p className="text-gray-600 mb-6">
              {error || 'The internship posting you are looking for does not exist.'}
            </p>
            <Button asChild>
              <Link to="/internships">Browse All Internships</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Button variant="ghost" asChild>
        <Link to="/internships" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Internships
        </Link>
      </Button>

      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">{internship.title}</CardTitle>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="flex items-center gap-1">
              <Building className="h-4 w-4" />
              {internship.company_name}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {internship.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {internship.duration}
            </span>
            <Badge variant="secondary">{internship.internship_type}</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-6">
            {internship.stipend && (
              <div className="text-green-600 font-medium text-lg">{internship.stipend}</div>
            )}
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleSaveInternship}
                disabled={isSaving || !user}
                className={isSaved ? "bg-blue-50 border-blue-200 text-blue-700" : ""}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
                {isSaved ? "Saved" : "Save"}
              </Button>
              <Button variant="outline" size="sm" onClick={handleShareInternship}>
                <Share2 className="h-4 w-4" />
                Share
              </Button>

              {canEdit && (
                <Button variant="outline" size="sm" asChild>
                  <Link to={`/internships/${id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              {canDelete && (
                <Button variant="destructive" size="sm" onClick={handleDeleteInternship}>
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
                      <DialogTitle>Apply for {internship.title}</DialogTitle>
                      <DialogDescription>
                        Submit your application for this internship. Please provide your resume and an optional cover letter.
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
                          onClick={handleApplyForInternship}
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

          <div className="space-y-6">
            {internship.summary && (
              <div>
                <h3 className="font-semibold mb-2">Summary</h3>
                <p className="text-gray-700">{internship.summary}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <div
                className="text-gray-700 prose max-w-none"
                dangerouslySetInnerHTML={{ __html: internship.content }}
              />
            </div>

            {internship.eligibility_criteria && (
              <div>
                <h3 className="font-semibold mb-2">Eligibility Criteria</h3>
                <div
                  className="text-gray-700 prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: internship.eligibility_criteria }}
                />
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Company:</span>
                <span className="ml-2 text-gray-600">{internship.company_name}</span>
              </div>
              <div>
                <span className="font-medium">Location:</span>
                <span className="ml-2 text-gray-600">{internship.location}</span>
              </div>
              <div>
                <span className="font-medium">Type:</span>
                <span className="ml-2 text-gray-600">{internship.internship_type}</span>
              </div>
              {internship.duration && (
                <div>
                  <span className="font-medium">Duration:</span>
                  <span className="ml-2 text-gray-600">{internship.duration}</span>
                </div>
              )}
              {internship.stipend && (
                <div>
                  <span className="font-medium">Stipend:</span>
                  <span className="ml-2 text-gray-600">{internship.stipend}</span>
                </div>
              )}
              {internship.application_deadline && (
                <div>
                  <span className="font-medium">Application Deadline:</span>
                  <span className="ml-2 text-gray-600">
                    {new Date(internship.application_deadline).toLocaleDateString()}
                  </span>
                </div>
              )}
              {internship.contact_email && (
                <div>
                  <span className="font-medium">Contact:</span>
                  <a
                    href={`mailto:${internship.contact_email}`}
                    className="ml-2 text-primary hover:underline"
                  >
                    {internship.contact_email}
                  </a>
                </div>
              )}
              <div>
                <span className="font-medium">Posted:</span>
                <span className="ml-2 text-gray-600">
                  {new Date(internship.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            {internship.tags && (
              <div className="flex gap-2">
                {internship.tags.split(',').map((tag, index) => (
                  <Badge key={index} variant="outline">{tag.trim()}</Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InternshipDetail;
