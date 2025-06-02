import React, { useState, useEffect } from 'react';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { contentApi } from '@/services/api';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Calendar,
  Eye,
  MessageSquare
} from 'lucide-react';

interface PendingPaper {
  content_id: number;
  title: string;
  summary: string;
  created_at: string;
  authors: string;
  abstract: string;
  keywords: string;
  author_name: string;
  author_email: string;
  review_id: number;
  status: string;
  submitted_at: string;
}

const ResearchPaperReviews = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [pendingPapers, setPendingPapers] = useState<PendingPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reviewingPaper, setReviewingPaper] = useState<number | null>(null);
  const [reviewComments, setReviewComments] = useState('');

  // Check if user has permission to review research papers
  if (!user || !hasPermission(Permission.RESEARCH_REVIEW)) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-red-400 mx-auto mb-4" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Access Denied</h2>
            <p className="text-gray-600 mb-6">
              You don't have permission to review research papers.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    fetchPendingPapers();
  }, []);

  const fetchPendingPapers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await contentApi.getPendingResearchPapers();
      if (response.success) {
        setPendingPapers(response.pending_papers);
      } else {
        throw new Error('Failed to fetch pending papers');
      }
    } catch (err: any) {
      console.error('Error fetching pending papers:', err);
      setError(err.message || 'Failed to load pending research papers');
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (contentId: number, action: 'approve' | 'reject' | 'request_revision') => {
    try {
      setReviewingPaper(contentId);

      const response = await contentApi.reviewResearchPaper(contentId, {
        action,
        comments: reviewComments.trim() || undefined
      });

      if (response.success) {
        toast({
          title: "Review Submitted",
          description: `Research paper has been ${action}d successfully.`,
        });

        // Remove the reviewed paper from the list
        setPendingPapers(prev => prev.filter(paper => paper.content_id !== contentId));
        setReviewComments('');
      } else {
        throw new Error('Failed to submit review');
      }
    } catch (err: any) {
      console.error('Error reviewing paper:', err);
      toast({
        title: "Review Failed",
        description: err.message || "Failed to submit review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setReviewingPaper(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case 'Under Review':
        return <Badge variant="default"><Eye className="h-3 w-3 mr-1" />Under Review</Badge>;
      case 'Approved':
        return <Badge variant="default" className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case 'Rejected':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      case 'Needs Revision':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Needs Revision</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
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

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          {[...Array(3)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded"></div>
                  <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Research Paper Reviews</h1>
        <p className="text-lg text-gray-600">
          Review and approve research papers submitted by users
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <Alert className="mb-6" variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingPapers.filter(p => p.status === 'Pending').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Eye className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Under Review</p>
                <p className="text-2xl font-bold text-gray-900">
                  {pendingPapers.filter(p => p.status === 'Under Review').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center">
              <FileText className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Submissions</p>
                <p className="text-2xl font-bold text-gray-900">{pendingPapers.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Papers List */}
      {pendingPapers.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No Pending Reviews
            </h3>
            <p className="text-gray-600">
              All research papers have been reviewed. New submissions will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {pendingPapers.map((paper) => (
            <Card key={paper.content_id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-xl mb-2">{paper.title}</CardTitle>
                    <CardDescription className="flex items-center gap-4 text-sm">
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {paper.authors}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        Submitted {formatDate(paper.submitted_at)}
                      </span>
                    </CardDescription>
                  </div>
                  {getStatusBadge(paper.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Abstract */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Abstract</h4>
                    <p className="text-gray-700 text-sm leading-relaxed">{paper.abstract}</p>
                  </div>

                  {/* Keywords */}
                  {paper.keywords && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">Keywords</h4>
                      <div className="flex flex-wrap gap-2">
                        {paper.keywords.split(',').map((keyword, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {keyword.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Author Information */}
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">Submitted by</h4>
                    <p className="text-sm text-gray-600">
                      {paper.author_name} ({paper.author_email})
                    </p>
                  </div>

                  {/* Review Actions */}
                  {(paper.status === 'Pending' || paper.status === 'Under Review') && (
                    <div className="border-t pt-4">
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor={`comments-${paper.content_id}`}>Review Comments</Label>
                          <Textarea
                            id={`comments-${paper.content_id}`}
                            placeholder="Add your review comments here..."
                            value={reviewComments}
                            onChange={(e) => setReviewComments(e.target.value)}
                            rows={3}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleReview(paper.content_id, 'approve')}
                            disabled={reviewingPaper === paper.content_id}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Approve
                          </Button>

                          <Button
                            variant="outline"
                            onClick={() => handleReview(paper.content_id, 'request_revision')}
                            disabled={reviewingPaper === paper.content_id}
                          >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Request Revision
                          </Button>

                          <Button
                            variant="destructive"
                            onClick={() => handleReview(paper.content_id, 'reject')}
                            disabled={reviewingPaper === paper.content_id}
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResearchPaperReviews;
