import React, { useState, useEffect } from 'react';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BookOpen,
  Search,
  Filter,
  Plus,
  Eye,
  MessageSquare,
  Calendar,
  User,
  Loader2,
  Save,
  Edit,
  Trash2,
  ArrowLeft,
  ArrowRight,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { contentApi, userApi, BlogPost } from '@/services/api';
import { getOptimizedImageUrl, handleImageError } from '@/utils/imageUtils';
import LikeButton from '@/components/ui/LikeButton';

const BlogPosts = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const canCreateContent = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);
  const canSaveContent = hasPermission(Permission.CONTENT_SAVE);

  const categories = [
    'Constitutional Law',
    'Corporate Law',
    'Employment Law',
    'Intellectual Property',
    'Criminal Law',
    'Family Law',
    'General',
  ];

  // Fetch blog posts from API
  const fetchBlogPosts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (selectedCategory !== 'all') {
          params.category = selectedCategory;
        }

        const response = await contentApi.getBlogPosts(params);
        setBlogPosts(response.blog_posts || []);
      } catch (err) {
        console.error('Error fetching blog posts:', err);
        setError('Failed to load blog posts. Using sample data.');

        // Fallback to dummy data if API fails
        setBlogPosts([
          {
            content_id: 1,
            user_id: 1,
            title: 'Understanding Constitutional Law: A Comprehensive Guide',
            summary: 'An in-depth exploration of constitutional principles and their modern applications.',
            content: '',
            featured_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop&crop=center',
            tags: 'constitution,law,government',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            status: 'published',
            is_featured: false,
            category: 'Constitutional Law',
            allow_comments: true,
            is_published: true,
            publication_date: '2024-01-15T00:00:00Z',
            author_name: 'Dr. Sarah Johnson',
            comment_count: 23,
          },
          {
            content_id: 2,
            user_id: 2,
            title: 'Corporate Law Essentials for New Lawyers',
            summary: 'Key concepts every new lawyer should know about corporate legal practice.',
            content: '',
            featured_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
            tags: 'corporate,business,contracts',
            created_at: '2024-01-12T00:00:00Z',
            updated_at: '2024-01-12T00:00:00Z',
            status: 'published',
            is_featured: false,
            category: 'Corporate Law',
            allow_comments: true,
            is_published: true,
            publication_date: '2024-01-12T00:00:00Z',
            author_name: 'Michael Chen',
            comment_count: 15,
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchBlogPosts();
  }, [selectedCategory]);

  const handleSaveBlogPost = async (post: BlogPost) => {
    try {
      await userApi.saveContent({ content_id: post.content_id, notes: `Saved blog post: ${post.title}` });
      toast({
        title: "Success",
        description: "Blog post saved to your personal library successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save blog post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteBlogPost = async (postId: number) => {
    if (!confirm('Are you sure you want to delete this blog post? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteBlogPost(postId);
      toast({
        title: "Success",
        description: "Blog post deleted successfully.",
      });
      // Refresh blog posts to remove deleted post
      fetchBlogPosts();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete blog post. Please try again.",
        variant: "destructive",
      });
    }
  };

  const filteredPosts = blogPosts.filter(post => {
    const tags = post.tags ? post.tags.split(',') : [];
    const title = post.title || '';
    const summary = post.summary || '';
    const matchesSearch = title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         summary.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tags.some(tag => tag.trim().toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Modern Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-black via-gray-900 to-gray-800 p-8 md:p-12 mb-12 border border-gray-700">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/20 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/10 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
          </div>

          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex-1 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 shadow-sm mb-6">
                <BookOpen className="h-4 w-4 text-white" />
                <span className="text-sm font-semibold text-white">Legal Insights Hub</span>
              </div>

              <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
                Expert Legal
                <span className="block bg-gradient-to-r from-gray-200 to-white bg-clip-text text-transparent">
                  Insights
                </span>
              </h1>

              <p className="text-xl text-gray-100 leading-relaxed max-w-2xl mb-8">
                Discover cutting-edge legal analysis, industry trends, and expert commentary from leading legal professionals worldwide.
              </p>

              <div className="flex flex-col sm:flex-row items-center gap-4">
                {canCreateContent && (
                  <Button asChild size="lg" className="bg-white text-black hover:bg-gray-100 shadow-xl border-0 font-semibold px-8 py-3">
                    <Link to="/blogs/create">
                      <Plus className="h-5 w-5 mr-2" />
                      Write Article
                    </Link>
                  </Button>
                )}
                <div className="flex items-center gap-6 text-gray-200">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{filteredPosts.length}</div>
                    <div className="text-sm">Articles</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">{categories.length}</div>
                    <div className="text-sm">Categories</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-white">50K+</div>
                    <div className="text-sm">Readers</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating Elements */}
            <div className="relative hidden lg:block">
              <div className="relative">
                <div className="w-64 h-64 bg-white/10 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-8">
                  <div className="space-y-4">
                    <div className="h-4 bg-white/20 rounded-full"></div>
                    <div className="h-4 bg-white/15 rounded-full w-3/4"></div>
                    <div className="h-4 bg-white/10 rounded-full w-1/2"></div>
                    <div className="mt-6 space-y-2">
                      <div className="h-3 bg-white/15 rounded-full"></div>
                      <div className="h-3 bg-white/10 rounded-full w-4/5"></div>
                      <div className="h-3 bg-white/10 rounded-full w-3/5"></div>
                    </div>
                  </div>
                </div>

                {/* Floating badges */}
                <div className="absolute -top-4 -right-4 p-3 bg-emerald-500 rounded-2xl shadow-lg animate-bounce">
                  <MessageSquare className="h-6 w-6 text-white" />
                </div>

                <div className="absolute -bottom-4 -left-4 p-3 bg-amber-500 rounded-2xl shadow-lg animate-pulse">
                  <Eye className="h-6 w-6 text-white" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modern Search and Filters */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Search Bar */}
            <div className="relative flex-1">
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                <Search className="h-5 w-5" />
              </div>
              <Input
                placeholder="Search articles, topics, or authors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg border border-gray-300 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 transition-all duration-200"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-full lg:w-64 border border-gray-300 bg-gray-50 rounded-xl focus:bg-white focus:ring-2 focus:ring-gray-500/20 transition-all duration-200">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="border-gray-200 rounded-xl shadow-xl">
                  <SelectItem value="all" className="rounded-lg">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="rounded-lg">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Results Count */}
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-xl border border-gray-300">
                <span className="text-sm font-medium text-gray-700">
                  {filteredPosts.length} {filteredPosts.length === 1 ? 'article' : 'articles'}
                </span>
              </div>
            </div>
          </div>
        </div>

      {/* Error Message */}
      {error && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <p className="text-yellow-800 text-sm">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <Skeleton className="aspect-video rounded-t-lg" />
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-6 w-20" />
                  <div className="flex gap-2">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                </div>
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <div className="flex justify-between mb-3">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-20" />
                  <Skeleton className="h-5 w-14" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

        {/* Modern Blog Posts Grid */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const tags = post.tags ? post.tags.split(',').map(tag => tag.trim()) : [];
              return (
                <article key={post.content_id} className="group cursor-pointer">
                  <div className="bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden border border-gray-200 hover:border-gray-400">
                    {/* Image Container */}
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(post.featured_image, 800, 400, 'blog')}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        onError={(e) => handleImageError(e, 'blog')}
                        loading="lazy"
                      />

                      {/* Gradient Overlay */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

                      {/* Featured Badge */}
                      {post.is_featured && (
                        <div className="absolute top-4 left-4">
                          <div className="px-3 py-1 bg-black text-white text-xs font-bold rounded-full shadow-lg">
                            ⭐ Featured
                          </div>
                        </div>
                      )}

                      {/* Category Badge */}
                      <div className="absolute top-4 right-4">
                        <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-gray-800 text-xs font-semibold rounded-full shadow-md border border-gray-300">
                          {post.category}
                        </div>
                      </div>

                      {/* Read Time */}
                      <div className="absolute bottom-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <div className="px-3 py-1 bg-black/50 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                          {Math.ceil((post.content?.length || 0) / 1000)} min read
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      {/* Title */}
                      <Link to={`/blogs/${post.content_id}`} className="block group-hover:text-gray-600 transition-colors duration-300">
                        <h2 className="text-xl font-bold text-black mb-3 line-clamp-2 leading-tight">
                          {post.title}
                        </h2>
                      </Link>

                      {/* Summary */}
                      <p className="text-gray-600 text-sm leading-relaxed mb-4 line-clamp-3">
                        {post.summary}
                      </p>

                      {/* Tags */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {tags.slice(0, 3).map((tag) => (
                          <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-300">
                            #{tag}
                          </span>
                        ))}
                        {tags.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full font-medium border border-gray-300">
                            +{tags.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Author and Date */}
                      <div className="flex items-center justify-between text-sm text-gray-500 mb-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-black rounded-full flex items-center justify-center border border-gray-300">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <span className="font-medium text-gray-700">{post.author_name}</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{new Date(post.publication_date || post.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center justify-between">
                        <Button asChild variant="outline" size="sm" className="rounded-full border-gray-300 text-gray-700 hover:bg-black hover:text-white transition-all duration-300">
                          <Link to={`/blogs/${post.content_id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            Read Article
                          </Link>
                        </Button>

                        <div className="flex items-center gap-2">
                          <LikeButton
                            contentId={post.content_id}
                            variant="compact"
                            size="sm"
                            showCount={true}
                          />

                          {canSaveContent && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSaveBlogPost(post)}
                              className="rounded-full text-gray-600 hover:bg-gray-100 hover:text-gray-800"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Show delete button for admin (all posts) or editor (own posts only) */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && post.user_id === parseInt(user.id))) && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteBlogPost(post.content_id)}
                              className="rounded-full text-red-600 hover:bg-red-50 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Modern Empty State */}
        {!loading && filteredPosts.length === 0 && (
          <div className="text-center py-16">
            <div className="relative inline-block mb-8">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center mx-auto border border-gray-300">
                <BookOpen className="h-12 w-12 text-gray-600" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 bg-black rounded-full flex items-center justify-center">
                <Search className="h-4 w-4 text-white" />
              </div>
            </div>

            <h3 className="text-2xl font-bold text-black mb-3">
              No articles found
            </h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              {searchTerm || selectedCategory !== 'all'
                ? "Try adjusting your search terms or filters to find what you're looking for."
                : "Be the first to share your legal insights with the community."
              }
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {canCreateContent && (
                <Button asChild size="lg" className="bg-black hover:bg-gray-800 text-white shadow-lg">
                  <Link to="/blogs/create">
                    <Plus className="h-5 w-5 mr-2" />
                    Write Your First Article
                  </Link>
                </Button>
              )}

              {(searchTerm || selectedCategory !== 'all') && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedCategory('all');
                  }}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  Clear Filters
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Modern Pagination */}
        {!loading && filteredPosts.length > 0 && (
          <div className="flex justify-center mt-12">
            <div className="flex items-center gap-2 p-2 bg-white rounded-2xl shadow-lg border border-gray-200">
              <Button variant="ghost" size="sm" disabled className="rounded-xl">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                <Button size="sm" className="bg-black text-white rounded-xl min-w-[40px]">
                  1
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl min-w-[40px] hover:bg-gray-100">
                  2
                </Button>
                <Button variant="ghost" size="sm" className="rounded-xl min-w-[40px] hover:bg-gray-100">
                  3
                </Button>
                <span className="px-2 text-gray-400">...</span>
                <Button variant="ghost" size="sm" className="rounded-xl min-w-[40px] hover:bg-gray-100">
                  12
                </Button>
              </div>

              <Button variant="ghost" size="sm" className="rounded-xl">
                Next
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogPosts;
