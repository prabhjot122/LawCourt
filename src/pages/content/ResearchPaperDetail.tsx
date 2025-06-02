import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { contentApi, userApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  User,
  FileText,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Download,
  Share2,
  Eye,
  Quote,
  Building,
  Tag,
  Edit,
  Trash2
} from 'lucide-react';

interface ResearchPaper {
  content_id: number;
  user_id: number;
  title: string;
  summary: string;
  content: string;
  featured_image: string;
  tags: string;
  created_at: string;
  updated_at: string;
  status: string;
  is_featured: boolean;
  authors: string;
  publication: string;
  publication_date: string;
  doi: string;
  keywords: string;
  abstract: string;
  citation_count: number;
  author_name: string;
  pdf_url?: string;
}

const ResearchPaperDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [paper, setPaper] = useState<ResearchPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);

  // Permission checks
  const canEdit = paper && user && (user.id === paper.user_id.toString() || user.role === 'Admin');
  const canDelete = paper && user && user.role === 'Admin';

  useEffect(() => {
    if (id) {
      fetchResearchPaper(parseInt(id));
    }
  }, [id]);

  const fetchResearchPaper = async (paperId: number) => {
    try {
      setLoading(true);
      setError(null);

      const response = await contentApi.getResearchPaper(paperId);

      if (response.research_paper) {
        // Map backend field names to frontend interface
        const mappedPaper = {
          content_id: response.research_paper.Content_ID,
          user_id: response.research_paper.User_ID,
          title: response.research_paper.Title,
          summary: response.research_paper.Summary,
          content: response.research_paper.Content,
          featured_image: response.research_paper.Featured_Image,
          tags: response.research_paper.Tags,
          created_at: response.research_paper.Created_At,
          updated_at: response.research_paper.Updated_At,
          status: response.research_paper.Status,
          is_featured: response.research_paper.Is_Featured,
          authors: response.research_paper.Authors,
          publication: response.research_paper.Publication,
          publication_date: response.research_paper.Publication_Date,
          doi: response.research_paper.DOI,
          keywords: response.research_paper.Keywords,
          abstract: response.research_paper.Abstract,
          citation_count: response.research_paper.Citation_Count,
          author_name: response.research_paper.Author_Name,
          pdf_url: response.research_paper.Featured_Image // Using Featured_Image as PDF URL
        };
        setPaper(mappedPaper);
        // Check if paper is bookmarked (you'll need to implement this check)
        // setIsBookmarked(await checkIfBookmarked(paperId));
      } else {
        setError('Research paper not found');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load research paper');
    } finally {
      setLoading(false);
    }
  };

  const handleBookmark = async () => {
    if (!user || !paper) {
      toast({
        title: "Authentication Required",
        description: "Please log in to bookmark research papers.",
        variant: "destructive",
      });
      return;
    }

    if (!hasPermission(Permission.CONTENT_SAVE)) {
      toast({
        title: "Permission Denied",
        description: "You don't have permission to save content.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBookmarkLoading(true);

      if (isBookmarked) {
        await userApi.unsaveContent(paper.content_id);
        setIsBookmarked(false);
        toast({
          title: "Bookmark Removed",
          description: "Research paper removed from your library.",
        });
      } else {
        await userApi.saveContent({ content_id: paper.content_id, notes: `Saved research paper: ${paper.title}` });
        setIsBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Research paper saved to your library.",
        });
      }
    } catch (err: any) {
      console.error('Error bookmarking paper:', err);
      toast({
        title: "Error",
        description: err.message || "Failed to bookmark research paper.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: paper?.title,
          text: paper?.abstract,
          url: window.location.href,
        });
      } catch (err) {
        // Sharing failed, fallback to clipboard
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied",
        description: "Research paper link copied to clipboard.",
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatKeywords = (keywords: string) => {
    return keywords.split(',').map(keyword => keyword.trim()).filter(Boolean);
  };

  const handleDeletePaper = async () => {
    if (!paper || !canDelete) return;

    if (!confirm('Are you sure you want to delete this research paper? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteResearchPaper(paper.content_id);
      toast({
        title: "Success",
        description: "Research paper deleted successfully.",
      });
      navigate('/research');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete research paper. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-12 bg-gray-200 rounded w-3/4 mb-6"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded mb-6"></div>
        </div>
      </div>
    );
  }

  if (error || !paper) {
    return (
      <div className="min-h-screen bg-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <Card className="bg-white border-gray-200">
            <CardContent className="text-center py-12">
              <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h2 className="text-2xl font-semibold text-black mb-2">Research Paper Not Found</h2>
              <p className="text-gray-600 mb-6">{error || 'The research paper you are looking for does not exist.'}</p>
              <Button onClick={() => navigate('/research')} className="bg-black hover:bg-gray-800 text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Research Papers
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Navigation Header */}
        <div className="flex items-center gap-2 mb-6 text-sm text-gray-600">
          <Button
            variant="ghost"
            onClick={() => navigate('/research')}
            className="p-0 h-auto text-gray-600 hover:text-black"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Papers
          </Button>
          <span className="text-gray-400">/</span>
          <span className="text-gray-400">arxiv:2505.17894</span>
          <Button variant="ghost" size="sm" className="ml-2 p-1 h-6 w-6">
            <FileText className="h-3 w-3" />
          </Button>
        </div>

        {/* Main Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-6 leading-tight">
            {paper.title}
          </h1>

          {/* Publication Info */}
          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
            <div className="flex items-center gap-1">
              <span>Published on</span>
              <span className="font-medium">
                {new Date(paper.publication_date || paper.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1">
              <span>⭐ Submitted by</span>
              <span className="text-blue-600 font-medium">{paper.author_name}</span>
              <span>on</span>
              <span className="font-medium">
                {new Date(paper.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-200">
              #1 Paper of the day
            </Badge>
          </div>

          {/* Authors */}
          <div className="mb-6">
            <span className="text-sm text-gray-600">Authors: </span>
            {paper.authors.split(',').map((author, index) => (
              <span key={index}>
                <span className="text-blue-600 hover:underline cursor-pointer font-medium">
                  {author.trim()}
                </span>
                {index < paper.authors.split(',').length - 1 && ', '}
              </span>
            ))}
          </div>
        </div>

        {/* Abstract Section */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-black mb-4">Abstract</h2>

          {/* Abstract */}
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed text-base">
              {paper.abstract}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="outline"
            className="bg-white border-gray-300 text-black hover:bg-gray-50"
            onClick={() => window.open(`https://arxiv.org/abs/${paper.doi || '2505.17894'}`, '_blank')}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            View arXiv page
          </Button>

          <Button
            variant="outline"
            className="bg-white border-gray-300 text-black hover:bg-gray-50"
            onClick={() => window.open(paper.pdf_url || '#', '_blank')}
          >
            <FileText className="h-4 w-4 mr-2" />
            View PDF
          </Button>

          <Button
            variant="outline"
            className="bg-white border-gray-300 text-black hover:bg-gray-50"
            onClick={handleBookmark}
            disabled={bookmarkLoading}
          >
            {isBookmarked ? (
              <BookmarkCheck className="h-4 w-4 mr-2" />
            ) : (
              <Bookmark className="h-4 w-4 mr-2" />
            )}
            Add to collection
          </Button>

          {/* Admin/Editor Actions */}
          {canEdit && (
            <Button variant="outline" asChild className="bg-white border-gray-300 text-black hover:bg-gray-50">
              <Link to={`/research/${paper.content_id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
          )}

          {canDelete && (
            <Button variant="destructive" onClick={handleDeletePaper}>
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          )}
        </div>

        {/* Full Content */}
        {paper.content && paper.content !== paper.abstract && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">Full Paper Content</h2>
            <div className="prose max-w-none">
              <div className="text-gray-700 leading-relaxed whitespace-pre-wrap bg-gray-50 p-6 rounded-lg">
                {paper.content}
              </div>
            </div>
          </div>
        )}

        {/* Keywords */}
        {paper.keywords && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-black mb-4">Keywords</h2>
            <div className="flex flex-wrap gap-2">
              {formatKeywords(paper.keywords).map((keyword, index) => (
                <Badge key={index} className="bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200">
                  {keyword}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Paper Metadata */}
        <div className="bg-gray-50 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-black mb-4">Paper Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">Authors</p>
                <p className="font-medium text-black">{paper.authors}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Publication</p>
                <p className="font-medium text-black">{paper.publication || 'Not specified'}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Publication Date</p>
                <p className="font-medium text-black">
                  {paper.publication_date ? new Date(paper.publication_date).toLocaleDateString() : 'Not specified'}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-1">DOI</p>
                <p className="font-medium">
                  {paper.doi ? (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      {paper.doi}
                    </a>
                  ) : 'Not available'}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Citations</p>
                <p className="font-medium text-black">{paper.citation_count || 0}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600 mb-1">Submitted by</p>
                <p className="font-medium text-black">{paper.author_name}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResearchPaperDetail;
