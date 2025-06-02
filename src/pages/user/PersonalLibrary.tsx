import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, Permission } from '@/contexts/AuthContext';
import { userApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BookOpen,
  FileText,
  Bookmark,
  Search,
  Filter,
  Calendar,
  User,
  ExternalLink,
  Trash2,
  Eye,
  Copy,
  Download,
  TrendingUp,
  Star,
  ArrowRight,
  Library,
  Heart,
  Clock,
  Briefcase,
  Users
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface SavedContent {
  save_id: number;
  content_id: number;
  saved_at: string;
  notes: string;
  title: string;
  summary: string;
  content_type?: string;
  content_created_at: string;
  author_name: string;
  category?: string;
  type_specific_id?: number;
  content?: string;
}

const PersonalLibrary = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();

  const [savedContent, setSavedContent] = useState<SavedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState('all');
  const [sortBy, setSortBy] = useState('saved_at');

  // Check if user has permission to access personal library
  if (!user || !hasPermission(Permission.CONTENT_SAVE)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <Card className="border-2 border-gray-100 shadow-xl bg-white">
            <CardContent className="text-center py-16">
              <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                <Library className="h-16 w-16 text-gray-600" />
              </div>
              <h2 className="text-3xl font-bold text-black mb-4 modern-heading">Access Restricted</h2>
              <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                You need appropriate permissions to access your personal library. Please contact an administrator.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  useEffect(() => {
    fetchSavedContent();
  }, [contentTypeFilter, sortBy]);

  const fetchSavedContent = async () => {
    try {
      setLoading(true);
      setError(null);

      const params: any = {
        limit: 50,
        offset: 0
      };

      if (contentTypeFilter !== 'all') {
        params.content_type = contentTypeFilter;
      }

      const response = await userApi.getSavedContent(params);
      if (response.success) {
        setSavedContent(response.saved_content);
      } else {
        throw new Error('Failed to fetch saved content');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load saved content');
    } finally {
      setLoading(false);
    }
  };

  const handleUnsaveContent = async (contentId: number) => {
    try {
      await userApi.unsaveContent(contentId);
      setSavedContent(prev => prev.filter(item => item.content_id !== contentId));
      toast({
        title: "Content Removed",
        description: "Content removed from your library.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to remove content.",
        variant: "destructive",
      });
    }
  };

  const getContentTypeIcon = (contentType: string | undefined) => {
    switch (contentType) {
      case 'Blog_Post':
        return <FileText className="h-4 w-4" />;
      case 'Research_Paper':
        return <BookOpen className="h-4 w-4" />;
      case 'Note':
        return <FileText className="h-4 w-4" />;
      case 'Course':
        return <BookOpen className="h-4 w-4" />;
      case 'Job':
        return <Bookmark className="h-4 w-4" />;
      case 'Internship':
        return <Bookmark className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getContentTypeColor = (contentType: string | undefined) => {
    switch (contentType) {
      case 'Blog_Post':
        return 'bg-blue-100 text-blue-800';
      case 'Research_Paper':
        return 'bg-green-100 text-green-800';
      case 'Note':
        return 'bg-purple-100 text-purple-800';
      case 'Course':
        return 'bg-orange-100 text-orange-800';
      case 'Job':
        return 'bg-red-100 text-red-800';
      case 'Internship':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getContentLink = (item: SavedContent) => {
    const id = item.type_specific_id || item.content_id;
    switch (item.content_type) {
      case 'Blog_Post':
        return `/blogs/${id}`;
      case 'Research_Paper':
        return `/research-papers/${id}`;
      case 'Note':
        return `/notes/${id}`;
      case 'Course':
        return `/courses/${id}`;
      case 'Job':
        return `/jobs/${id}`;
      case 'Internship':
        return `/internships/${id}`;
      default:
        return '#';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const filteredContent = savedContent.filter(item => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      item.title.toLowerCase().includes(searchLower) ||
      item.author_name.toLowerCase().includes(searchLower) ||
      item.summary.toLowerCase().includes(searchLower) ||
      (item.category && item.category.toLowerCase().includes(searchLower))
    );
  });

  const groupedContent = {
    all: filteredContent,
    Blog_Post: filteredContent.filter(item => item.content_type === 'Blog_Post'),
    Research_Paper: filteredContent.filter(item => item.content_type === 'Research_Paper'),
    Note: filteredContent.filter(item => item.content_type === 'Note'),
    Course: filteredContent.filter(item => item.content_type === 'Course'),
    Job: filteredContent.filter(item => item.content_type === 'Job'),
    Internship: filteredContent.filter(item => item.content_type === 'Internship'),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="space-y-8">
            {/* Header Skeleton */}
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded-xl w-1/3 animate-pulse"></div>
              <div className="h-6 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
            </div>

            {/* Search Skeleton */}
            <Card className="border-2 border-gray-100 shadow-xl">
              <CardContent className="pt-6">
                <div className="flex gap-4">
                  <div className="h-12 bg-gray-200 rounded-xl flex-1 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
                  <div className="h-12 bg-gray-200 rounded-xl w-48 animate-pulse"></div>
                </div>
              </CardContent>
            </Card>

            {/* Content Skeletons */}
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="border-2 border-gray-100 shadow-xl">
                  <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="h-12 w-12 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="space-y-3 flex-1">
                          <div className="h-6 bg-gray-200 rounded-lg w-3/4 animate-pulse"></div>
                          <div className="h-4 bg-gray-200 rounded-lg w-1/2 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <div className="h-10 w-20 bg-gray-200 rounded-xl animate-pulse"></div>
                        <div className="h-10 w-24 bg-gray-200 rounded-xl animate-pulse"></div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded-lg w-full animate-pulse"></div>
                      <div className="h-4 bg-gray-200 rounded-lg w-2/3 animate-pulse"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="space-y-8">
          {/* Modern Header Section */}
          <div className="relative overflow-hidden">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
                    <Library className="h-8 w-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-black tracking-tight modern-heading">
                      Personal Library
                    </h1>
                    <p className="text-gray-700 text-lg font-medium mt-2">
                      Your curated collection of saved legal content and resources
                    </p>
                  </div>
                </div>

                {/* Stats Bar */}
                <div className="flex items-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">{savedContent.length} Saved Items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-800" />
                    <span className="font-medium">
                      {savedContent.length > 0 ? `Last saved ${format(new Date(Math.max(...savedContent.map(item => new Date(item.saved_at).getTime()))), 'MMM dd')}` : 'No items yet'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Search and Filters */}
          <Card className="border-2 border-gray-100 shadow-xl hover:shadow-2xl transition-all duration-300 bg-white">
            <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-white shadow-md border border-gray-300">
                  <Search className="h-5 w-5 text-gray-800" />
                </div>
                <div>
                  <CardTitle className="text-lg text-black modern-heading">Search Your Collection</CardTitle>
                  <p className="text-gray-600 text-sm">Find and organize your saved content</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                  <Input
                    placeholder="Search by title, author, or content..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-12 h-12 border-2 border-gray-200 focus:border-gray-900 focus:ring-gray-900/10 rounded-xl text-lg font-medium transition-all duration-300"
                  />
                </div>

                <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                  <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-gray-600" />
                      <SelectValue placeholder="Content Type" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="Blog_Post">Blog Posts</SelectItem>
                    <SelectItem value="Research_Paper">Research Papers</SelectItem>
                    <SelectItem value="Note">Notes</SelectItem>
                    <SelectItem value="Course">Courses</SelectItem>
                    <SelectItem value="Job">Jobs</SelectItem>
                    <SelectItem value="Internship">Internships</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full lg:w-56 h-12 border-2 border-gray-200 focus:border-gray-900 rounded-xl font-medium">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-gray-600" />
                      <SelectValue placeholder="Sort By" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="saved_at">Date Saved</SelectItem>
                    <SelectItem value="content_created_at">Date Created</SelectItem>
                    <SelectItem value="title">Title</SelectItem>
                    <SelectItem value="author_name">Author</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Enhanced Content Tabs */}
          <Tabs defaultValue="all" className="space-y-8">
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-wrap gap-3 justify-center">
                <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <Bookmark className="h-4 w-4" />
                    All ({groupedContent.all.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="Blog_Post"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    Blogs ({groupedContent.Blog_Post.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="Research_Paper"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <BookOpen className="h-4 w-4" />
                    Research ({groupedContent.Research_Paper.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="Note"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    Notes ({groupedContent.Note.length})
                  </TabsTrigger>
                </TabsList>

                <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="Course"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <BookOpen className="h-4 w-4" />
                    Courses ({groupedContent.Course.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="Job"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <Briefcase className="h-4 w-4" />
                    Jobs ({groupedContent.Job.length})
                  </TabsTrigger>
                  <TabsTrigger
                    value="Internship"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <Users className="h-4 w-4" />
                    Internships ({groupedContent.Internship.length})
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            {Object.entries(groupedContent).map(([key, items]) => (
              <TabsContent key={key} value={key} className="space-y-6">
                {items.length === 0 ? (
                  <Card className="border-2 border-gray-100 shadow-xl bg-gradient-to-br from-gray-50 to-white">
                    <CardContent className="text-center py-16">
                      <div className="p-6 rounded-3xl bg-gray-100 w-fit mx-auto mb-8">
                        <Bookmark className="h-16 w-16 text-gray-600" />
                      </div>
                      <h3 className="text-2xl font-bold text-black mb-3 modern-heading">
                        No Saved Content
                      </h3>
                      <p className="text-gray-600 mb-8 max-w-md mx-auto text-lg">
                        {searchTerm.trim()
                          ? 'No content matches your search criteria. Try adjusting your search terms.'
                          : `You haven't saved any ${key === 'all' ? 'content' : key.replace('_', ' ').toLowerCase()} yet. Start building your personal library!`
                        }
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {items.map((item) => (
                      <Card key={item.save_id} className="group border-2 border-gray-100  shadow-xl hover:shadow-2xl transition-all duration-500 cursor-pointer bg-white hover:-translate-y-1 transform-gpu">
                        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
                          <div className="flex justify-between items-start">
                            <div className="flex items-center gap-4 flex-1">
                              <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                                {getContentTypeIcon(item.content_type)}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <Badge className={cn(
                                    "px-3 py-1 text-xs font-bold rounded-lg",
                                    item.content_type === 'Blog_Post' && "bg-blue-100 text-blue-800",
                                    item.content_type === 'Research_Paper' && "bg-green-100 text-green-800",
                                    item.content_type === 'Note' && "bg-purple-100 text-purple-800",
                                    item.content_type === 'Course' && "bg-orange-100 text-orange-800",
                                    item.content_type === 'Job' && "bg-red-100 text-red-800",
                                    item.content_type === 'Internship' && "bg-yellow-100 text-yellow-800",
                                    !item.content_type && "bg-gray-100 text-gray-800"
                                  )}>
                                    {item.content_type ? item.content_type.replace('_', ' ') : 'Unknown'}
                                  </Badge>
                                  {item.category && (
                                    <Badge variant="outline" className="border-gray-800 text-gray-800 bg-gray-50">
                                      {item.category}
                                    </Badge>
                                  )}
                                </div>
                                <CardTitle className="text-xl mb-3 modern-heading group-hover:text-gray-900">
                                  <Link
                                    to={getContentLink(item)}
                                    className="hover:text-gray-600 transition-colors"
                                  >
                                    {item.title}
                                  </Link>
                                </CardTitle>
                                <div className="flex flex-wrap items-center gap-4 text-gray-600">
                                  <span className="flex items-center gap-2 font-medium">
                                    <User className="h-4 w-4 text-gray-800" />
                                    {item.author_name}
                                  </span>
                                  <span className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-gray-800" />
                                    Saved {format(new Date(item.saved_at), 'MMM dd, yyyy')}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <Button
                                asChild
                                className="bg-black hover:bg-gray-800 text-white px-6 py-2 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 group"
                              >
                                <Link to={getContentLink(item)}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleUnsaveContent(item.content_id)}
                                className="text-red-600 hover:text-red-700 border-2 border-red-200 hover:border-red-400 hover:bg-red-50 px-4 py-2 rounded-xl font-medium transition-all duration-300"
                              >
                                <Trash2 className="h-4 w-4 mr-1" />
                                Remove
                              </Button>
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                          <p className="text-gray-700 mb-6 text-lg leading-relaxed">{item.summary}</p>
                          {item.notes && (
                            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-6 rounded-2xl border border-gray-200">
                              <h4 className="font-bold text-black mb-3 flex items-center gap-2">
                                <Copy className="h-4 w-4" />
                                Your Notes:
                              </h4>
                              <p className="text-gray-700 font-medium leading-relaxed">{item.notes}</p>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default PersonalLibrary;
