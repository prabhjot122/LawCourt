import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { contentApi } from '@/services/api';
import NoteTypeSelection from '@/components/notes/NoteTypeSelection';
import PDFUploadComponent from '@/components/notes/PDFUploadComponent';
import { NoteTextEditorWrapper } from '@/components/notes/NoteTextEditor';

const CreateEditNote = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isEditing = !!id;

  // New state for the two-option interface
  const [currentStep, setCurrentStep] = useState<'selection' | 'text' | 'pdf' | 'pdf-form'>('selection');
  const [selectedType, setSelectedType] = useState<'text' | 'pdf' | null>(null);
  const [uploadedPDFData, setUploadedPDFData] = useState<{
    fileUrl: string;
    fileName: string;
    fileSize: number;
    extractedText: string;
  } | null>(null);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    is_private: false,
  });

  const [saving, setSaving] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEditing);

  const categories = [
    'Study Notes',
    'Practice Notes',
    'Research',
    'Case Notes',
    'Meeting Notes',
    'General',
  ];

  // Load existing note if editing
  useEffect(() => {
    if (isEditing && id) {
      const fetchNote = async () => {
        try {
          setInitialLoading(true);
          const response = await contentApi.getNote(parseInt(id));
          const note = response.note;

          setFormData({
            title: note.title,
            content: note.content,
            category: note.category || '',
            is_private: note.is_private || false,
          });

          // For editing, skip selection and go directly to appropriate editor
          if (note.content_type === 'pdf') {
            setSelectedType('pdf');
            setCurrentStep('pdf-form');
            // Set PDF data if available
            if (note.pdf_file_path) {
              setUploadedPDFData({
                fileUrl: note.pdf_file_path,
                fileName: note.title + '.pdf',
                fileSize: note.pdf_file_size || 0,
                extractedText: note.content || ''
              });
            }
          } else {
            setSelectedType('text');
            setCurrentStep('text');
          }
        } catch (err) {
          console.error('Error fetching note:', err);
          toast({
            title: "Error",
            description: "Failed to load note for editing.",
            variant: "destructive",
          });
          navigate('/notes');
        } finally {
          setInitialLoading(false);
        }
      };

      fetchNote();
    }
  }, [id, isEditing, navigate, toast]);

  // Handler for type selection
  const handleTypeSelection = (type: 'text' | 'pdf') => {
    setSelectedType(type);
    setCurrentStep(type);
  };

  // Handler for PDF upload
  const handlePDFUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:5000/api/notes/upload-pdf', {
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

      // Set the uploaded PDF data for later use
      setUploadedPDFData({
        fileUrl: data.file_url,
        fileName: data.filename,
        fileSize: data.file_size,
        extractedText: data.extracted_text || ''
      });

      return data.file_url;
    } catch (error) {
      throw new Error('Failed to upload PDF file');
    }
  };

  // Handler for PDF upload completion
  const handlePDFUploadComplete = (fileUrl: string, fileName: string) => {
    // The upload data should already be set by the upload handler
    // Just proceed to the form step
    setCurrentStep('pdf-form');
  };

  // Handler for text note saving
  const handleTextNoteSave = async (data: {
    title: string;
    content: string;
    category: string;
    is_private: boolean;
  }) => {
    try {
      const submitData = {
        ...data,
        content_type: 'text'
      };

      if (isEditing && id) {
        await contentApi.updateNote(parseInt(id), submitData);
        toast({
          title: "Success",
          description: "Note updated successfully.",
        });
      } else {
        await contentApi.createNote(submitData);
        toast({
          title: "Success",
          description: "Note created successfully.",
        });
      }

      navigate('/notes');
    } catch (err) {
      console.error('Error saving note:', err);
      toast({
        title: "Error",
        description: "Failed to save note. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Handler for PDF note saving
  const handlePDFNoteSave = async (data: {
    title: string;
    content: string;
    category: string;
    is_private: boolean;
  }) => {
    if (!uploadedPDFData) {
      toast({
        title: "Error",
        description: "No PDF file uploaded.",
        variant: "destructive",
      });
      return;
    }

    try {
      const submitData = {
        ...data,
        content_type: 'pdf',
        pdf_file_path: uploadedPDFData.fileUrl,
        pdf_file_size: uploadedPDFData.fileSize,
        extracted_text: uploadedPDFData.extractedText
      };

      if (isEditing && id) {
        await contentApi.updateNote(parseInt(id), submitData);
        toast({
          title: "Success",
          description: "PDF note updated successfully.",
        });
      } else {
        await contentApi.createNote(submitData);
        toast({
          title: "Success",
          description: "PDF note created successfully.",
        });
      }

      navigate('/notes');
    } catch (err) {
      console.error('Error saving PDF note:', err);
      toast({
        title: "Error",
        description: "Failed to save PDF note. Please try again.",
        variant: "destructive",
      });
      throw err;
    }
  };

  // Handler for going back to selection
  const handleBackToSelection = () => {
    setCurrentStep('selection');
    setSelectedType(null);
    setUploadedPDFData(null);
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
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

  // Render different components based on current step
  if (currentStep === 'selection' && !isEditing) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Link>
        </Button>
        <NoteTypeSelection onSelectType={handleTypeSelection} />
      </div>
    );
  }

  if (currentStep === 'pdf') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Link>
        </Button>
        <PDFUploadComponent
          onFileUpload={handlePDFUpload}
          onUploadComplete={handlePDFUploadComplete}
          onCancel={handleBackToSelection}
        />
      </div>
    );
  }

  if (currentStep === 'text') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Link>
        </Button>
        <NoteTextEditorWrapper
          initialData={isEditing ? formData : undefined}
          onSave={handleTextNoteSave}
          onCancel={isEditing ? () => navigate('/notes') : handleBackToSelection}
          isEditing={isEditing}
        />
      </div>
    );
  }

  if (currentStep === 'pdf-form') {
    return (
      <div className="container mx-auto px-4 py-8">
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/notes" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Notes
          </Link>
        </Button>

        {/* PDF Form with metadata */}
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="text-center space-y-2">
            <h2 className="text-2xl font-bold text-black modern-heading">PDF Note Details</h2>
            <p className="text-gray-600">
              Add title and categorization for your PDF note
            </p>
          </div>

          <Card className="border-2 border-gray-200 shadow-lg">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="text-lg text-black modern-heading">Note Information</CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-6">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-black">
                  Note Title *
                </Label>
                <Input
                  id="title"
                  placeholder="Enter your note title..."
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium text-black">
                    Category
                  </Label>
                  <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                    <SelectTrigger className="h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                      <SelectValue placeholder="Select a category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium text-black">Privacy Settings</Label>
                  <div className="flex items-center space-x-2 h-12">
                    <Checkbox
                      id="private"
                      checked={formData.is_private}
                      onCheckedChange={(checked) => setFormData({ ...formData, is_private: checked as boolean })}
                      className="border-2 border-gray-300"
                    />
                    <Label htmlFor="private" className="text-sm font-medium text-gray-700 cursor-pointer">
                      Make this note private
                    </Label>
                  </div>
                </div>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={isEditing ? () => navigate('/notes') : handleBackToSelection}
                  disabled={saving}
                  className="border-2 border-gray-200 text-gray-700 hover:border-gray-900 hover:bg-gray-50 px-6 py-3 rounded-xl font-medium"
                >
                  {isEditing ? 'Cancel' : 'Back'}
                </Button>

                <Button
                  onClick={() => handlePDFNoteSave(formData)}
                  disabled={saving || !formData.title.trim()}
                  className="bg-black text-white hover:bg-gray-800 px-6 py-3 rounded-xl font-medium"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      {isEditing ? 'Update PDF Note' : 'Save PDF Note'}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
};

export default CreateEditNote;
