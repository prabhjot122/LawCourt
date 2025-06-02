import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, User, Calendar, Eye, Heart, Save, Edit, Lock, Globe, Copy, Trash2, FileText, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { contentApi, Note } from '@/services/api';
import { useAuth, UserRole } from '@/contexts/AuthContext';
import PDFViewer from '@/components/notes/PDFViewer';
import { cn } from '@/lib/utils';

const NoteDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [note, setNote] = useState<Note | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateContent = user?.role === UserRole.ADMIN || user?.role === UserRole.EDITOR;
  const canEdit = note && user && canCreateContent && (user.id === note.user_id.toString() || user.role === UserRole.ADMIN);
  const canDelete = note && user && user.role === UserRole.ADMIN;

  useEffect(() => {
    if (id) {
      fetchNote(parseInt(id));
    }
  }, [id]);

  const fetchNote = async (noteId: number) => {
    try {
      setLoading(true);
      setError(null);
      const response = await contentApi.getNote(noteId);
      setNote(response.note);
    } catch (error: any) {
      console.error('Error fetching note:', error);
      setError(error.message || 'Failed to load note');
      toast({
        title: "Error",
        description: "Failed to load note. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveNote = async () => {
    if (!note) return;

    try {
      if (contentApi.saveNoteToLibrary) {
        await contentApi.saveNoteToLibrary(note.note_id);
        toast({
          title: "Success",
          description: "Note saved to your library successfully!",
        });
      } else {
        toast({
          title: "Info",
          description: "Save functionality will be available soon!",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteNote = async () => {
    if (!note || !canDelete) return;

    if (!confirm('Are you sure you want to delete this note? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteNote(note.note_id);
      toast({
        title: "Success",
        description: "Note deleted successfully.",
      });
      navigate('/notes');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete note. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Function to strip HTML tags from text
  const stripHtmlTags = (html: string) => {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    return tempDiv.textContent || tempDiv.innerText || '';
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (error || !note) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center py-12">
          <CardContent>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Note Not Found</h3>
            <p className="text-gray-600 mb-4">
              {error || "The note you're looking for doesn't exist or has been removed."}
            </p>
            <Button onClick={() => navigate('/notes')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Notes
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => navigate('/notes')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Notes
        </Button>

        <div className="flex items-center gap-2">
          {user && !canEdit && (
            <Button variant="outline" onClick={handleSaveNote}>
              <Save className="h-4 w-4 mr-2" />
              Save to Library
            </Button>
          )}

          {canEdit && (
            <Button asChild>
              <Link to={`/notes/${note.note_id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Note
              </Link>
            </Button>
          )}

          {canDelete && (
            <Button variant="destructive" onClick={handleDeleteNote}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Note
            </Button>
          )}
        </div>
      </div>

      {/* Note Content */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn(
                  "p-2 rounded-xl border border-gray-200",
                  note.content_type === 'pdf'
                    ? "bg-gradient-to-r from-red-50 to-red-100"
                    : "bg-gradient-to-r from-gray-50 to-gray-100"
                )}>
                  {note.content_type === 'pdf' ? (
                    <File className="h-5 w-5 text-red-600" />
                  ) : (
                    <FileText className="h-5 w-5 text-gray-700" />
                  )}
                </div>
                <CardTitle className="text-2xl">{note.title}</CardTitle>
                {note.is_private ? (
                  <Lock className="h-5 w-5 text-gray-500" />
                ) : (
                  <Globe className="h-5 w-5 text-green-600" />
                )}
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{note.category}</Badge>
                {note.content_type === 'pdf' && (
                  <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                    PDF Document
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mt-4">
            <div className="flex items-center">
              <User className="h-4 w-4 mr-1" />
              {note.author_name}
            </div>
            <div className="flex items-center">
              <Calendar className="h-4 w-4 mr-1" />
              {formatDate(note.created_at)}
            </div>
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {note.view_count || 0} views
            </div>
            {note.save_count !== undefined && (
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                {note.save_count} saves
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          {/* Summary */}
          {note.summary && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Summary</h3>
              <p className="text-gray-700 bg-gray-50 p-4 rounded-lg">{stripHtmlTags(note.summary)}</p>
            </div>
          )}

          {/* Content - PDF or Text */}
          {note.content_type === 'pdf' && note.pdf_file_path ? (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">PDF Document</h3>
              <PDFViewer
                fileUrl={note.pdf_file_path}
                fileName={note.title + '.pdf'}
              />
            </div>
          ) : (
            <div className="prose max-w-none">
              <div
                className="text-gray-800 leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: note.content }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Related Actions */}
      <div className="mt-8 flex justify-center">
        <Button variant="outline" onClick={() => navigate('/notes')}>
          Browse More Notes
        </Button>
      </div>
    </div>
  );
};

export default NoteDetail;
