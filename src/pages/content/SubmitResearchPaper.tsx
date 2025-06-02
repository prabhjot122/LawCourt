import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { contentApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, Upload, FileText, AlertCircle, CheckCircle, Link as LinkIcon } from 'lucide-react';
import ResearchPaperPDFUpload from '@/components/research/ResearchPaperPDFUpload';

const SubmitResearchPaper = () => {
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    abstract: '',
    authors: '',
    journal_name: '',
    publication_date: '',
    doi: '',
    keywords: '',
    pdf_url: '',
    thumbnail_url: ''
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pdfUploadMethod, setPdfUploadMethod] = useState<'url' | 'upload'>('url');
  const [uploadedPdfData, setUploadedPdfData] = useState<{
    fileUrl: string;
    fileName: string;
  } | null>(null);

  // Check if user has permission to submit research papers
  if (!user || !hasPermission(Permission.RESEARCH_SUBMIT)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to submit research papers for review.
            </p>
            <Button onClick={() => navigate('/research-papers')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Research Papers
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // Handler for PDF upload
  const handlePDFUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/research-papers/submit/upload-pdf', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('session_token')}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload PDF');
      }

      const data = await response.json();

      // Store thumbnail URL if available
      if (data.thumbnail_url) {
        setFormData(prev => ({ ...prev, thumbnail_url: data.thumbnail_url }));
      }

      return data.file_url;
    } catch (error) {
      throw new Error('Failed to upload PDF file');
    }
  };

  const handlePDFUploadComplete = (fileUrl: string, fileName: string) => {
    setUploadedPdfData({ fileUrl, fileName });
    setFormData(prev => ({ ...prev, pdf_url: fileUrl }));
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.abstract.trim()) {
      newErrors.abstract = 'Abstract is required';
    }

    if (!formData.authors.trim()) {
      newErrors.authors = 'Authors are required';
    }

    if (formData.doi && !/^10\.\d{4,}\//.test(formData.doi)) {
      newErrors.doi = 'Please enter a valid DOI (e.g., 10.1000/xyz123)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const response = await contentApi.submitResearchPaperForReview({
        title: formData.title.trim(),
        abstract: formData.abstract.trim(),
        authors: formData.authors.trim(),
        journal_name: formData.journal_name.trim() || undefined,
        publication_date: formData.publication_date || undefined,
        doi: formData.doi.trim() || undefined,
        keywords: formData.keywords.trim() || undefined,
        pdf_url: formData.pdf_url.trim() || undefined,
      });

      if (response.success) {
        toast({
          title: "Research Paper Submitted",
          description: "Your research paper has been submitted for review. You will be notified once it's reviewed.",
        });
        navigate('/research');
      } else {
        throw new Error('Failed to submit research paper');
      }
    } catch (error: any) {
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit research paper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/research')}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Research Papers
        </Button>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Submit Research Paper</h1>
          <p className="text-lg text-gray-600">
            Submit your research paper for review by our editorial team
          </p>
        </div>
      </div>

      {/* Information Alert */}
      <Alert className="mb-6">
        <CheckCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Review Process:</strong> Your research paper will be reviewed by our editorial team.
          Once approved, it will be published and visible to all users. You will receive a notification
          about the review status.
        </AlertDescription>
      </Alert>

      {/* Submission Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Research Paper Details
          </CardTitle>
          <CardDescription>
            Please provide accurate information about your research paper. All fields marked with * are required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Enter the title of your research paper"
                className={errors.title ? 'border-red-500' : ''}
              />
              {errors.title && (
                <p className="text-sm text-red-600">{errors.title}</p>
              )}
            </div>

            {/* Authors */}
            <div className="space-y-2">
              <Label htmlFor="authors">Authors *</Label>
              <Input
                id="authors"
                name="authors"
                value={formData.authors}
                onChange={handleInputChange}
                placeholder="e.g., John Doe, Jane Smith, Robert Johnson"
                className={errors.authors ? 'border-red-500' : ''}
              />
              {errors.authors && (
                <p className="text-sm text-red-600">{errors.authors}</p>
              )}
              <p className="text-sm text-gray-500">
                List all authors separated by commas
              </p>
            </div>

            {/* Abstract */}
            <div className="space-y-2">
              <Label htmlFor="abstract">Abstract *</Label>
              <Textarea
                id="abstract"
                name="abstract"
                value={formData.abstract}
                onChange={handleInputChange}
                placeholder="Provide a comprehensive abstract of your research paper..."
                rows={6}
                className={errors.abstract ? 'border-red-500' : ''}
              />
              {errors.abstract && (
                <p className="text-sm text-red-600">{errors.abstract}</p>
              )}
              <p className="text-sm text-gray-500">
                Minimum 100 words recommended
              </p>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                name="keywords"
                value={formData.keywords}
                onChange={handleInputChange}
                placeholder="e.g., machine learning, artificial intelligence, neural networks"
              />
              <p className="text-sm text-gray-500">
                Separate keywords with commas
              </p>
            </div>

            {/* Journal Name */}
            <div className="space-y-2">
              <Label htmlFor="journal_name">Journal/Publication</Label>
              <Input
                id="journal_name"
                name="journal_name"
                value={formData.journal_name}
                onChange={handleInputChange}
                placeholder="e.g., Nature, Science, IEEE Transactions"
              />
            </div>

            {/* Publication Date */}
            <div className="space-y-2">
              <Label htmlFor="publication_date">Publication Date</Label>
              <Input
                id="publication_date"
                name="publication_date"
                type="date"
                value={formData.publication_date}
                onChange={handleInputChange}
              />
            </div>

            {/* DOI */}
            <div className="space-y-2">
              <Label htmlFor="doi">DOI</Label>
              <Input
                id="doi"
                name="doi"
                value={formData.doi}
                onChange={handleInputChange}
                placeholder="e.g., 10.1000/xyz123"
                className={errors.doi ? 'border-red-500' : ''}
              />
              {errors.doi && (
                <p className="text-sm text-red-600">{errors.doi}</p>
              )}
              <p className="text-sm text-gray-500">
                Digital Object Identifier (if available)
              </p>
            </div>

            {/* PDF Section */}
            <div className="space-y-4">
              <Label className="text-base font-medium">PDF File (Optional)</Label>

              {/* Upload Method Toggle */}
              <div className="flex items-center gap-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="url-method-submit"
                    name="upload-method-submit"
                    checked={pdfUploadMethod === 'url'}
                    onChange={() => setPdfUploadMethod('url')}
                    className="w-4 h-4 text-black bg-gray-100 border-gray-300 focus:ring-black"
                  />
                  <Label htmlFor="url-method-submit" className="cursor-pointer">
                    <LinkIcon className="h-4 w-4 inline mr-1" />
                    URL Link
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="radio"
                    id="upload-method-submit"
                    name="upload-method-submit"
                    checked={pdfUploadMethod === 'upload'}
                    onChange={() => setPdfUploadMethod('upload')}
                    className="w-4 h-4 text-black bg-gray-100 border-gray-300 focus:ring-black"
                  />
                  <Label htmlFor="upload-method-submit" className="cursor-pointer">
                    <Upload className="h-4 w-4 inline mr-1" />
                    Upload File
                  </Label>
                </div>
              </div>

              {/* URL Input */}
              {pdfUploadMethod === 'url' && (
                <div className="space-y-2">
                  <Label htmlFor="pdf_url">PDF URL</Label>
                  <Input
                    id="pdf_url"
                    name="pdf_url"
                    type="url"
                    value={formData.pdf_url}
                    onChange={handleInputChange}
                    placeholder="https://example.com/paper.pdf"
                  />
                  <p className="text-sm text-gray-500">
                    Link to the PDF version of your paper
                  </p>
                </div>
              )}

              {/* File Upload */}
              {pdfUploadMethod === 'upload' && (
                <div className="space-y-2">
                  <Label>Upload PDF File</Label>
                  <ResearchPaperPDFUpload
                    onFileUpload={handlePDFUpload}
                    onUploadComplete={handlePDFUploadComplete}
                    disabled={loading}
                  />
                  {uploadedPdfData && (
                    <div className="text-sm text-green-600">
                      ✓ Uploaded: {uploadedPdfData.fileName}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/research')}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Upload className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Submit for Review
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SubmitResearchPaper;
