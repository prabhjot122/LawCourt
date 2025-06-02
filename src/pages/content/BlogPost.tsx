import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import LikeButton from '@/components/ui/LikeButton';
import {
  Calendar,
  User,
  Eye,
  MessageSquare,
  Share2,
  Bookmark,
  ArrowLeft,
  Loader2,
  Send,
  Trash2,
  Edit,
  Heart,
  TrendingUp,
} from 'lucide-react';
import { contentApi, userApi, BlogPost as BlogPostType, Comment } from '@/services/api';
import { getOptimizedImageUrl, handleImageError } from '@/utils/imageUtils';

const BlogPost = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [post, setPost] = useState<BlogPostType | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [bookmarkLoading, setBookmarkLoading] = useState(false);
  const [metrics, setMetrics] = useState({
    views: 0,
    likes: 0,
    shares: 0,
    comments: 0
  });

  // Permission checks
  const canEdit = post && user && (user.id === post.user_id.toString() || user.role === 'Admin');
  const canDelete = post && user && user.role === 'Admin';

  // Fetch blog post and comments
  useEffect(() => {
    const fetchBlogPost = async () => {
      if (!id) return;

      try {
        setLoading(true);
        setError(null);

        const response = await contentApi.getBlogPost(parseInt(id));
        setPost(response.blog_post);
        setComments(response.comments || []);

        // Set metrics from response or use defaults
        setMetrics({
          views: response.blog_post.views || 0,
          likes: response.blog_post.likes || 0,
          shares: response.blog_post.shares || 0,
          comments: response.comments?.length || 0
        });

        // Check if the blog post is bookmarked by the current user
        if (user) {
          try {
            const savedContent = await userApi.getSavedContent({ content_type: 'Blog_Post' });
            const isCurrentPostSaved = savedContent.saved_content.some(
              (item: any) => item.content_id === response.blog_post.content_id
            );
            setIsBookmarked(isCurrentPostSaved);
          } catch (err) {
            console.error('Error checking bookmark status:', err);
          }
        }
      } catch (err) {
        console.error('Error fetching blog post:', err);
        setError('Failed to load blog post. Using sample data.');

        // Fallback to dummy data
        setPost({
          content_id: 1,
          user_id: 1,
          title: 'Understanding Constitutional Law: A Comprehensive Guide',
          summary: 'An in-depth exploration of constitutional principles and their modern applications.',
          content: `
            <p>Constitutional law forms the foundation of our legal system, establishing the framework within which all other laws operate. This comprehensive guide explores the key principles and modern applications of constitutional law.</p>

            <h2>What is Constitutional Law?</h2>
            <p>Constitutional law is the body of law that defines the relationship between different entities within a state, namely, the executive, the legislature, and the judiciary. It establishes the basic principles and laws of a nation.</p>

            <h2>Key Principles</h2>
            <p>The fundamental principles of constitutional law include:</p>
            <ul>
              <li><strong>Separation of Powers:</strong> The division of government responsibilities into distinct branches</li>
              <li><strong>Checks and Balances:</strong> Each branch's ability to limit the powers of the other branches</li>
              <li><strong>Federalism:</strong> The distribution of power between national and state governments</li>
              <li><strong>Individual Rights:</strong> Protection of fundamental freedoms and liberties</li>
            </ul>

            <h2>Modern Applications</h2>
            <p>In today's digital age, constitutional law continues to evolve to address new challenges such as privacy rights in the digital realm, freedom of speech on social media platforms, and the balance between security and liberty.</p>

            <h2>Conclusion</h2>
            <p>Understanding constitutional law is essential for anyone working in the legal field. It provides the framework for interpreting and applying all other areas of law.</p>
          `,
          featured_image: '/api/placeholder/800/400',
          tags: 'constitution,law,government,legal-principles',
          created_at: '2024-01-15T00:00:00Z',
          updated_at: '2024-01-15T00:00:00Z',
          status: 'published',
          is_featured: false,
          category: 'Constitutional Law',
          allow_comments: true,
          is_published: true,
          publication_date: '2024-01-15T00:00:00Z',
          author_name: 'Dr. Sarah Johnson',
          comment_count: 3,
        });

        setComments([
          {
            comment_id: 1,
            content_id: 1,
            user_id: 2,
            comment_text: 'Excellent overview of constitutional principles. Very helpful for understanding the basics.',
            created_at: '2024-01-16T00:00:00Z',
            author_name: 'John Smith',
          },
          {
            comment_id: 2,
            content_id: 1,
            user_id: 3,
            comment_text: 'The section on modern applications is particularly insightful. Thank you for sharing!',
            created_at: '2024-01-16T00:00:00Z',
            author_name: 'Maria Garcia',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchBlogPost();
  }, [id, user]);

  const handleAddComment = async () => {
    if (!newComment.trim() || !post || !user) return;

    try {
      setSubmittingComment(true);

      const response = await contentApi.addComment(post.content_id, newComment.trim());

      // Add the new comment to the list
      const newCommentObj: Comment = {
        comment_id: response.comment_id,
        content_id: post.content_id,
        user_id: user.id,
        comment_text: newComment.trim(),
        created_at: new Date().toISOString(),
        author_name: user.fullName,
      };

      setComments(prev => [...prev, newCommentObj]);
      setMetrics(prev => ({ ...prev, comments: prev.comments + 1 }));
      setNewComment('');

      toast({
        title: "Comment added",
        description: "Your comment has been posted successfully.",
      });
    } catch (err) {
      console.error('Error adding comment:', err);
      toast({
        title: "Error",
        description: "Failed to add comment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeletePost = async () => {
    if (!post || !canDelete) return;

    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteBlogPost(post.content_id);
      toast({
        title: "Success",
        description: "Blog post deleted successfully.",
      });
      navigate('/blogs');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleBookmark = async () => {
    if (!post || !user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to bookmark this blog post.",
        variant: "destructive",
      });
      return;
    }

    try {
      setBookmarkLoading(true);

      if (isBookmarked) {
        // Remove bookmark
        await userApi.unsaveContent(post.content_id);
        setIsBookmarked(false);
        toast({
          title: "Bookmark removed",
          description: "Blog post removed from your saved items.",
        });
      } else {
        // Add bookmark
        await userApi.saveContent({ content_id: post.content_id });
        setIsBookmarked(true);
        toast({
          title: "Bookmarked",
          description: "Blog post saved to your personal library.",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update bookmark. Please try again.",
        variant: "destructive",
      });
    } finally {
      setBookmarkLoading(false);
    }
  };



  const handleShare = async () => {
    if (!post) return;

    const shareData = {
      title: post.title,
      text: post.summary || `Check out this blog post: ${post.title}`,
      url: window.location.href,
    };

    try {
      // Update share count
      setMetrics(prev => ({ ...prev, shares: prev.shares + 1 }));

      // Check if Web Share API is supported
      if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
        await navigator.share(shareData);
        toast({
          title: "Shared successfully",
          description: "Blog post shared successfully.",
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Blog post link copied to clipboard.",
        });
      }
    } catch (error: any) {
      // If sharing fails, try clipboard as fallback
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast({
          title: "Link copied",
          description: "Blog post link copied to clipboard.",
        });
      } catch (clipboardError) {
        toast({
          title: "Share failed",
          description: "Unable to share or copy link. Please copy the URL manually.",
          variant: "destructive",
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog Posts
          </Link>
        </Button>

        <Card>
          <Skeleton className="aspect-video rounded-t-lg" />
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-8 w-full mb-4" />
            <Skeleton className="h-8 w-3/4 mb-6" />
            <div className="flex justify-between mb-6">
              <div className="flex gap-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-8" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-18" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-3/4 mb-4" />
            <Skeleton className="h-4 w-full mb-4" />
            <Skeleton className="h-4 w-2/3" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Button variant="ghost" asChild>
          <Link to="/blogs" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog Posts
          </Link>
        </Button>
        <Card>
          <CardContent className="text-center py-12">
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Blog post not found
            </h3>
            <p className="text-gray-600">
              The blog post you're looking for doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const tags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Navigation */}
        <div className="mb-8">
          <Button variant="ghost" asChild className="group hover:bg-gray-100 rounded-xl transition-all duration-300">
            <Link to="/blogs" className="flex items-center gap-2">
              <div className="p-1 rounded-lg bg-gray-100 group-hover:bg-gray-200 transition-colors duration-300 border border-gray-300">
                <ArrowLeft className="h-4 w-4 text-gray-600" />
              </div>
              <span className="font-medium text-gray-700">Back to Articles</span>
            </Link>
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
            <p className="text-amber-800 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Modern Article Header */}
        <article className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-100/50 mb-8">
          {/* Hero Image */}
          <div className="relative aspect-[21/9] overflow-hidden">
            <img
              src={getOptimizedImageUrl(post.featured_image, 1200, 600, 'blog')}
              alt={post.title}
              className="w-full h-full object-cover"
              onError={(e) => handleImageError(e, 'blog')}
              loading="lazy"
            />

            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

            {/* Category Badge */}
            <div className="absolute top-6 left-6">
              <div className="px-4 py-2 bg-white/90 backdrop-blur-sm rounded-full shadow-lg border border-gray-300">
                <span className="text-sm font-semibold text-gray-800">{post.category}</span>
              </div>
            </div>

            {/* Read Time */}
            <div className="absolute top-6 right-6">
              <div className="px-4 py-2 bg-black/50 backdrop-blur-sm rounded-full shadow-lg">
                <span className="text-sm font-medium text-white">
                  {Math.ceil((post.content?.length || 0) / 1000)} min read
                </span>
              </div>
            </div>
          </div>

          {/* Article Content */}
          <div className="p-8 lg:p-12">
            {/* Title */}
            <h1 className="text-4xl lg:text-5xl font-bold text-black mb-6 leading-tight">
              {post.title}
            </h1>

            {/* Author and Meta Info */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
              <div className="flex items-center gap-4">
                {/* Author Avatar */}
                <div className="w-12 h-12 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center shadow-lg border border-gray-300">
                  <User className="h-6 w-6 text-white" />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-lg font-semibold text-black">{post.author_name}</span>
                    <span className="text-gray-400">•</span>
                    <span className="text-gray-600">
                      {new Date(post.publication_date || post.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm">Legal Expert & Content Creator</p>
                </div>
              </div>

              {/* Engagement Metrics */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl border border-gray-300">
                    <Eye className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{metrics.views}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl border border-gray-300">
                    <Heart className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{metrics.likes}</span>
                  </div>
                  <div className="flex items-center gap-2 px-3 py-2 bg-gray-100 rounded-xl border border-gray-300">
                    <MessageSquare className="h-4 w-4 text-gray-500" />
                    <span className="font-medium text-gray-700">{metrics.comments}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 mb-8 pb-8 border-b border-gray-200">
              <LikeButton
                contentId={post.content_id}
                variant="default"
                size="md"
                className="rounded-full"
              />

              <Button variant="outline" onClick={handleShare} className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>

              <Button
                variant={isBookmarked ? "default" : "outline"}
                onClick={handleBookmark}
                disabled={bookmarkLoading}
                className={`rounded-full ${isBookmarked ? 'bg-black hover:bg-gray-800 text-white' : 'border-gray-300 text-gray-700 hover:bg-gray-100'}`}
              >
                {bookmarkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Bookmark className={`h-4 w-4 mr-2 ${isBookmarked ? 'fill-current' : ''}`} />
                )}
                {isBookmarked ? 'Saved' : 'Save'}
              </Button>

              {canEdit && (
                <Button variant="outline" asChild className="rounded-full border-gray-300 text-gray-700 hover:bg-gray-100">
                  <Link to={`/blogs/${post.content_id}/edit`}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Link>
                </Button>
              )}

              {canDelete && (
                <Button variant="destructive" onClick={handleDeletePost} className="rounded-full">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 text-sm font-medium rounded-full border border-gray-300">
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        </article>

        {/* Article Content */}
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200 mb-8">
          <div className="p-8 lg:p-12">
            <div
              className="prose prose-lg max-w-none prose-headings:text-black prose-p:text-gray-700 prose-p:leading-relaxed prose-a:text-gray-600 prose-strong:text-black prose-blockquote:border-gray-300 prose-blockquote:bg-gray-50 prose-blockquote:text-gray-700"
              dangerouslySetInnerHTML={{ __html: post.content || '' }}
            />
          </div>
        </div>

        {/* Modern Author Bio */}
        <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-8 mb-8 border border-gray-200">
          <h3 className="text-2xl font-bold text-black mb-6">About the Author</h3>
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-700 to-black rounded-2xl flex items-center justify-center shadow-lg border border-gray-300">
              <User className="h-10 w-10 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-semibold text-black mb-2">{post.author_name || 'Unknown Author'}</h4>
              <p className="text-gray-700 leading-relaxed mb-4">
                Experienced legal professional with expertise in {post.category.toLowerCase()}.
                Passionate about sharing knowledge and insights with the legal community.
              </p>
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-4 w-4" />
                  Legal Expert
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="h-4 w-4" />
                  Content Creator
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Comments Section */}
        {post.allow_comments && (
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-gray-200">
            <div className="p-8 lg:p-12">
              <h3 className="text-2xl font-bold text-black mb-8">
                Discussion ({comments?.length || 0})
              </h3>

              {/* Comment Form */}
              {user ? (
                <div className="mb-8 p-6 bg-gray-50 rounded-2xl border border-gray-200">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center border border-gray-300">
                      <User className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Share your thoughts on this article..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        rows={4}
                        className="resize-none border border-gray-300 bg-white rounded-xl shadow-sm focus:ring-2 focus:ring-gray-500/20"
                      />
                      <div className="flex justify-end mt-4">
                        <Button
                          onClick={handleAddComment}
                          disabled={!newComment.trim() || submittingComment}
                          className="bg-black hover:bg-gray-800 text-white rounded-full px-6"
                        >
                          {submittingComment ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Posting...
                            </>
                          ) : (
                            <>
                              <Send className="h-4 w-4 mr-2" />
                              Post Comment
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mb-8 p-6 bg-gray-100 rounded-2xl border border-gray-300">
                  <p className="text-gray-800 text-center">
                    <Link to="/login" className="font-semibold text-black hover:text-gray-700 underline">
                      Sign in
                    </Link>{' '}
                    to join the discussion and share your thoughts.
                  </p>
                </div>
              )}

              {/* Comments List */}
              <div className="space-y-6">
                {(comments?.length || 0) === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-300">
                      <MessageSquare className="h-8 w-8 text-gray-400" />
                    </div>
                    <h4 className="text-lg font-semibold text-black mb-2">No comments yet</h4>
                    <p className="text-gray-600">Be the first to share your thoughts on this article!</p>
                  </div>
                ) : (
                  comments?.map((comment) => (
                    <div key={comment?.comment_id || Math.random()} className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-gray-600 to-gray-800 rounded-full flex items-center justify-center border border-gray-300">
                            <User className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <span className="font-semibold text-black">{comment?.author_name || 'Anonymous'}</span>
                            <p className="text-sm text-gray-500">
                              {comment?.created_at ? new Date(comment.created_at).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }) : 'Unknown date'}
                            </p>
                          </div>
                        </div>
                        {user && user.id === String(comment?.user_id) && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full"
                            onClick={() => {
                              // TODO: Implement delete comment
                              toast({
                                title: "Feature coming soon",
                                description: "Comment deletion will be available soon.",
                              });
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <p className="text-gray-700 leading-relaxed">{comment?.comment_text || 'No comment text'}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPost;
