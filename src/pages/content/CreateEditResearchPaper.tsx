import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, FileText, Users, Calendar, Link as LinkIcon, Upload } from 'lucide-react';
import { contentApi } from '@/services/api';
import ResearchPaperPDFUpload from '@/components/research/ResearchPaperPDFUpload';

const CreateEditResearchPaper = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    publication_date: '',
    journal_name: '',
    doi: '',
    abstract: '',
    pdf_url: '',
    thumbnail_url: '',
    keywords: '',
    category: 'General',
    is_published: true,  // Default to published for better UX
  });

  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);
  const [pdfUploadMethod, setPdfUploadMethod] = useState<'url' | 'upload'>('url');
  const [uploadedPdfData, setUploadedPdfData] = useState<{
    fileUrl: string;
    fileName: string;
    thumbnailUrl?: string;
  } | null>(null);

  const categories = [
    'Constitutional Law',
    'Corporate Law',
    'Employment Law',
    'Intellectual Property',
    'Criminal Law',
    'Family Law',
    'International Law',
    'Environmental Law',
    'Tax Law',
    'General',
  ];

  // Load existing research paper if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchResearchPaper = async () => {
        try {
          setInitialLoading(true);
          const response = await contentApi.getResearchPaper(parseInt(id));
          const paper = response.research_paper;

          console.log('Fetched paper for editing:', paper); // Debug log

          // Map backend field names to frontend form data
          setFormData({
            title: paper.Title || '',
            authors: paper.Authors || '',
            publication_date: paper.Publication_Date || '',
            journal_name: paper.Publication || '',
            doi: paper.DOI || '',
            abstract: paper.Abstract || '',
            pdf_url: paper.Featured_Image || '',
            keywords: paper.Keywords || '',
            category: paper.Category || 'General',
            is_published: paper.Status === 'Active',
          });
        } catch (err) {
          console.error('Error fetching research paper:', err);
          toast({
            title: "Error",
            description: "Failed to load research paper for editing.",
            variant: "destructive",
          });
          navigate('/research');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchResearchPaper();
    }
  }, [id, isEditing, navigate, toast]);

  // Handler for PDF upload
  const handlePDFUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/research-papers/upload-pdf', {
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
        console.log('📸 New thumbnail generated:', data.thumbnail_url);
      }

      return data.file_url;
    } catch (error) {
      throw new Error('Failed to upload PDF file');
    }
  };

  const handlePDFUploadComplete = (fileUrl: string, fileName: string) => {
    setUploadedPdfData({ fileUrl, fileName });
    setFormData({ ...formData, pdf_url: fileUrl });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title?.trim() || !formData.abstract?.trim()) {
      toast({
        title: "Validation Error",
        description: "Title and abstract are required.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        title: formData.title?.trim() || '',
        authors: formData.authors?.trim() || '',
        publication_date: formData.publication_date || '',
        journal_name: formData.journal_name?.trim() || '',
        doi: formData.doi?.trim() || '',
        abstract: formData.abstract?.trim() || '',
        pdf_url: formData.pdf_url?.trim() || '',
        thumbnail_url: formData.thumbnail_url?.trim() || '',
        keywords: formData.keywords?.trim() || '',
        category: formData.category || 'General',
        is_published: formData.is_published || false,
      };

      if (isEditing && id) {
        await contentApi.updateResearchPaper(parseInt(id), submitData);
        toast({
          title: "Success",
          description: "Research paper updated successfully.",
        });
      } else {
        const response = await contentApi.createResearchPaper(submitData);
        toast({
          title: "Success",
          description: "Research paper created successfully.",
        });
        navigate(`/research`);
        return;
      }

      navigate('/research');
    } catch (err) {
      console.error('Error saving research paper:', err);
      toast({
        title: "Error",
        description: "Failed to save research paper. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/research" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Research Papers
          </Link>
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Loading...</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
              <div className="h-40 bg-gray-200 rounded animate-pulse" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Button variant="ghost" asChild>
        <Link to="/research" className="flex items-center gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Research Papers
        </Link>
      </Button>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter research paper title..."
                required
              />
            </div>

            {/* Authors */}
            <div className="space-y-2">
              <Label htmlFor="authors">Authors</Label>
              <Input
                id="authors"
                value={formData.authors}
                onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
                placeholder="e.g., John Doe, Jane Smith, et al."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Publication Date */}
              <div className="space-y-2">
                <Label htmlFor="publication_date">Publication Date</Label>
                <Input
                  id="publication_date"
                  type="date"
                  value={formData.publication_date}
                  onChange={(e) => setFormData({ ...formData, publication_date: e.target.value })}
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Journal Name */}
              <div className="space-y-2">
                <Label htmlFor="journal_name">Journal/Publication</Label>
                <Input
                  id="journal_name"
                  value={formData.journal_name}
                  onChange={(e) => setFormData({ ...formData, journal_name: e.target.value })}
                  placeholder="e.g., Harvard Law Review"
                />
              </div>

              {/* DOI */}
              <div className="space-y-2">
                <Label htmlFor="doi">DOI</Label>
                <Input
                  id="doi"
                  value={formData.doi}
                  onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                  placeholder="e.g., 10.1000/182"
                />
              </div>
            </div>

            {/* Keywords */}
            <div className="space-y-2">
              <Label htmlFor="keywords">Keywords</Label>
              <Input
                id="keywords"
                value={formData.keywords}
                onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
                placeholder="e.g., constitutional law, civil rights, due process"
              />
            </div>
          </CardContent>
        </Card>

        {/* Abstract Section */}
        <Card>
          <CardHeader>
            <CardTitle>Abstract *</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Textarea
                id="abstract"
                value={formData.abstract}
                onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
                placeholder="Enter the research paper abstract..."
                rows={8}
                required
              />
              <p className="text-sm text-gray-500">
                Provide a comprehensive summary of the research paper's content, methodology, and findings.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* PDF Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF File
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Upload Method Toggle */}
            <div className="flex items-center gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="url-method"
                  name="upload-method"
                  checked={pdfUploadMethod === 'url'}
                  onChange={() => setPdfUploadMethod('url')}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 focus:ring-black"
                />
                <Label htmlFor="url-method" className="cursor-pointer">
                  <LinkIcon className="h-4 w-4 inline mr-1" />
                  URL Link
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="upload-method"
                  name="upload-method"
                  checked={pdfUploadMethod === 'upload'}
                  onChange={() => setPdfUploadMethod('upload')}
                  className="w-4 h-4 text-black bg-gray-100 border-gray-300 focus:ring-black"
                />
                <Label htmlFor="upload-method" className="cursor-pointer">
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
                  type="url"
                  value={formData.pdf_url}
                  onChange={(e) => setFormData({ ...formData, pdf_url: e.target.value })}
                  placeholder="https://example.com/paper.pdf"
                />
                <p className="text-sm text-gray-500">
                  Provide a direct link to the PDF file of the research paper.
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
                  disabled={saving}
                />
                {uploadedPdfData && (
                  <div className="text-sm text-green-600">
                    ✓ Uploaded: {uploadedPdfData.fileName}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Publication Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="is_published"
                checked={formData.is_published}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, is_published: checked as boolean })
                }
              />
              <Label htmlFor="is_published">Publish immediately</Label>
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate('/research')}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={saving || !formData.title?.trim() || !formData.abstract?.trim()}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              isEditing ? 'Update Paper' : 'Create Paper'
            )}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default CreateEditResearchPaper;
