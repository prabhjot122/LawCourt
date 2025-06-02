import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth, UserRole, Permission } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Search, Download, Calendar, User, Plus, Loader2, Edit, Trash2, Save } from 'lucide-react';
import { contentApi, userApi, ResearchPaper } from '@/services/api';

const ResearchPapers = () => {
  const { user, hasPermission } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [papers, setPapers] = useState<ResearchPaper[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState('Daily');
  const [selectedDate, setSelectedDate] = useState('May 30');

  const canCreateContent = user && (user.role === UserRole.EDITOR || user.role === UserRole.ADMIN);
  const canSubmitForReview = hasPermission(Permission.RESEARCH_SUBMIT) && user?.role === UserRole.USER;
  const canSaveContent = user && hasPermission(Permission.CONTENT_SAVE);

  const handleSaveResearchPaper = async (paper: ResearchPaper) => {
    try {
      await userApi.saveContent({ content_id: paper.content_id, notes: `Saved research paper: ${paper.title}` });
      toast({
        title: "Success",
        description: "Research paper saved to your personal library successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save research paper. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteResearchPaper = async (paperId: number) => {
    if (!confirm('Are you sure you want to delete this research paper? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteResearchPaper(paperId);
      toast({
        title: "Success",
        description: "Research paper deleted successfully.",
      });
      // Refresh papers to remove deleted paper
      fetchResearchPapers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete research paper. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Fetch research papers from API
  const fetchResearchPapers = async () => {
      try {
        setLoading(true);
        setError(null);

        const params: any = {};
        if (searchTerm.trim()) {
          params.keywords = searchTerm.trim();
        }

        const response = await contentApi.getResearchPapers(params);
        setPapers(response.research_papers || []);
      } catch (err) {
        console.error('Error fetching research papers:', err);
        setError('Failed to load research papers. Using sample data.');

        // Fallback to dummy data
        setPapers([
          {
            content_id: 1,
            user_id: 1,
            title: 'The Evolution of Privacy Rights in Digital Age',
            summary: 'This paper examines how privacy rights have evolved with technological advancement...',
            content: '',
            featured_image: '',
            tags: 'privacy,digital,rights',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            status: 'published',
            is_featured: false,
            authors: 'Dr. Sarah Johnson, Prof. Michael Chen',
            publication: 'Journal of Digital Law',
            publication_date: '2024-01-15T00:00:00Z',
            doi: '10.1000/example.doi',
            keywords: 'privacy, digital rights, technology law',
            abstract: 'This paper examines how privacy rights have evolved with technological advancement and the challenges posed by digital transformation.',
            citation_count: 45,
            author_name: 'Dr. Sarah Johnson',
          },
          {
            content_id: 2,
            user_id: 2,
            title: 'Corporate Governance in Modern Business Law',
            summary: 'An analysis of corporate governance principles and their implementation...',
            content: '',
            featured_image: '',
            tags: 'corporate,governance,business',
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
            status: 'published',
            is_featured: false,
            authors: 'Lisa Rodriguez, David Wilson',
            publication: 'Corporate Law Review',
            publication_date: '2024-01-10T00:00:00Z',
            doi: '10.1000/example.doi2',
            keywords: 'corporate governance, business law, compliance',
            abstract: 'An analysis of corporate governance principles and their implementation in modern business environments.',
            citation_count: 32,
            author_name: 'Lisa Rodriguez',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchResearchPapers();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredPapers = papers.filter(paper => {
    if (!searchTerm.trim()) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      paper.title.toLowerCase().includes(searchLower) ||
      paper.authors.toLowerCase().includes(searchLower) ||
      paper.abstract.toLowerCase().includes(searchLower) ||
      (paper.keywords && paper.keywords.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="min-h-screen bg-white">
      <div className={`${user ? 'w-full px-0' : 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'} py-8`}>
        <div className="space-y-8">
          {/* Header - Research Papers with Day Filtering */}
          <div>
            <div className="flex items-center">
              {/* Left side - Title and subtitle */}
              <div className="flex-1">
                <div>
                  <h1 className="text-2xl font-bold text-black">Research Papers</h1>
                  <p className="text-sm text-gray-600 flex items-center gap-2 mt-1">
                  Explore groundbreaking research across disciplines.
                  </p>
                </div>
              </div>

              {/* Center - Search with AI */}
              <div className="flex-1 flex justify-center">
                <div className="w-full max-w-md">
                  <div className="flex items-center bg-gray-100 rounded-full border border-gray-300 px-4 py-2">
                    <Search className="h-4 w-4 text-gray-500 mr-3" />
                    <Input
                      placeholder="Search any paper with AI"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="bg-transparent border-0 text-black placeholder-gray-500 focus:ring-0 focus:outline-none p-0 text-sm flex-1"
                    />
                    
                  </div>
                </div>
              </div>

              {/* Right side - Time filters and date */}
              <div className="flex-1 flex justify-end">
                <div className="flex items-center gap-3">
                  {/* Time period filters */}
                  <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1">
                    {['Daily', 'Weekly', 'Monthly'].map((period) => (
                      <button
                        key={period}
                        onClick={() => setSelectedTimeFilter(period)}
                        className={`px-3 py-1 text-sm rounded-2xl transition-colors ${
                          selectedTimeFilter === period
                            ? 'text-white bg-black'
                            : 'text-gray-600 hover:text-black'
                        }`}
                      >
                        {period}
                      </button>
                    ))}
                  </div>

                  {/* Date navigation */}
                  <div className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-2">
                    <button
                      className="text-gray-600 hover:text-black"
                      onClick={() => {
                        // Previous date logic
                        const currentDate = new Date();
                        currentDate.setDate(currentDate.getDate() - 1);
                        setSelectedDate(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    </button>
                    <span className="text-sm text-black font-medium min-w-[60px] text-center">
                      {selectedDate}
                    </span>
                    <button
                      className="text-gray-600 hover:text-black"
                      onClick={() => {
                        // Next date logic
                        const currentDate = new Date();
                        currentDate.setDate(currentDate.getDate() + 1);
                        setSelectedDate(currentDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
                      }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Secondary filters row */}
          <div className="flex items-center justify-between py-4">
            <div className="flex gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48 bg-white border-gray-300 text-black">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="all" className="text-black hover:bg-gray-100">All Categories</SelectItem>
                  <SelectItem value="constitutional" className="text-black hover:bg-gray-100">Constitutional Law</SelectItem>
                  <SelectItem value="criminal" className="text-black hover:bg-gray-100">Criminal Law</SelectItem>
                  <SelectItem value="corporate" className="text-black hover:bg-gray-100">Corporate Law</SelectItem>
                  <SelectItem value="international" className="text-black hover:bg-gray-100">International Law</SelectItem>
                  <SelectItem value="environmental" className="text-black hover:bg-gray-100">Environmental Law</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40 bg-white border-gray-300 text-black">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-white border-gray-300">
                  <SelectItem value="newest" className="text-black hover:bg-gray-100">Newest</SelectItem>
                  <SelectItem value="oldest" className="text-black hover:bg-gray-100">Oldest</SelectItem>
                  <SelectItem value="title" className="text-black hover:bg-gray-100">Title A-Z</SelectItem>
                  <SelectItem value="citations" className="text-black hover:bg-gray-100">Most Cited</SelectItem>
                </SelectContent>
              </Select>

              {/* Submit for Review Button */}
              {canSubmitForReview && (
                <Button
                  variant="outline"
                  asChild
                  className="border-gray-300 text-black hover:bg-gray-100 hover:text-black transition-all duration-200"
                >
                  <Link to="/research-papers/submit">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit for Review
                  </Link>
                </Button>
              )}
            </div>

            <div className="flex items-center gap-4">
              {/* Submit Paper Button */}
              {canCreateContent && (
                <Button asChild className="bg-black hover:bg-gray-800 text-white">
                  <Link to="/research/create">
                    <Plus className="h-4 w-4 mr-2" />
                    Submit Paper
                  </Link>
                </Button>
              )}

              <div className="text-sm text-gray-600">
                {filteredPapers.length} papers found
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-2xl mx-auto">
              <Card className="border-red-300 bg-red-50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <p className="text-red-700 text-center">{error}</p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Loading State */}
          {loading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-white border-gray-200 overflow-hidden">
                  <div className="aspect-[4/3] bg-gray-100">
                    <Skeleton className="w-full h-full bg-gray-200" />
                  </div>
                  <CardContent className="p-6">
                    <Skeleton className="h-6 w-3/4 mb-3 bg-gray-200" />
                    <div className="flex gap-4 mb-3">
                      <Skeleton className="h-4 w-24 bg-gray-200" />
                      <Skeleton className="h-4 w-20 bg-gray-200" />
                    </div>
                    <Skeleton className="h-4 w-full mb-2 bg-gray-200" />
                    <Skeleton className="h-4 w-2/3 mb-4 bg-gray-200" />
                    <div className="flex justify-between items-center">
                      <Skeleton className="h-6 w-16 bg-gray-200" />
                      <Skeleton className="h-8 w-20 bg-gray-200" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Papers List */}
          {!loading && (
            <div>
              {filteredPapers.length === 0 ? (
                <div className="max-w-2xl mx-auto">
                  <Card className="bg-white border-gray-200">
                    <CardContent className="text-center py-16">
                      <FileText className="h-16 w-16 text-gray-400 mx-auto mb-6" />
                      <h3 className="text-xl font-medium text-black mb-3">
                        No research papers found
                      </h3>
                      <p className="text-gray-600 mb-6 text-lg">
                        {searchTerm.trim()
                          ? 'Try adjusting your search terms or explore different keywords.'
                          : 'Be the first to contribute to our research collection.'
                        }
                      </p>
                      {canCreateContent && (
                        <Button asChild className="bg-black hover:bg-gray-800 text-white font-medium">
                          <Link to="/research/create">
                            <Plus className="h-4 w-4 mr-2" />
                            Upload First Paper
                          </Link>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredPapers.map((paper) => (
                    <Card
                      key={paper.content_id}
                      className="bg-white border-gray-200 overflow-hidden hover:border-gray-300 transition-all duration-300 group w-full max-w-[482px] max-h-[395px] mx-auto"
                    >
                      {/* Paper Preview Image - Horizontal aspect ratio like in your image */}
                      <div className="w-full min-h-[250px] bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden">
                        {paper.thumbnail_url ? (
                          <>
                            <img
                              src={paper.thumbnail_url}
                              alt={`${paper.title} thumbnail`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                // Fallback to placeholder if thumbnail fails to load
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const fallback = target.nextElementSibling as HTMLElement;
                                if (fallback) fallback.style.display = 'flex';
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                            {/* Fallback placeholder (hidden by default) */}
                            <div className="absolute inset-0 flex items-center justify-center" style={{ display: 'none' }}>
                              <FileText className="h-16 w-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="absolute inset-0 bg-gradient-to-t from-white/60 to-transparent" />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <FileText className="h-16 w-16 text-gray-400 group-hover:text-gray-500 transition-colors" />
                            </div>
                          </>
                        )}

                        {/* Action Buttons Overlay */}
                        <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          {canSaveContent && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSaveResearchPaper(paper)}
                              className="bg-white/80 border-gray-300 text-black hover:bg-white hover:border-gray-400 backdrop-blur-sm"
                            >
                              <Save className="h-4 w-4" />
                            </Button>
                          )}

                          {/* Edit button for admin/editor */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && paper.user_id === parseInt(user.id))) && (
                            <Button
                              size="sm"
                              variant="outline"
                              asChild
                              className="bg-white/80 border-gray-300 text-black hover:bg-white hover:border-gray-400 backdrop-blur-sm"
                            >
                              <Link to={`/research-papers/${paper.content_id}/edit`}>
                                <Edit className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}

                          {/* Delete button for admin/editor */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && paper.user_id === parseInt(user.id))) && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDeleteResearchPaper(paper.content_id)}
                              className="bg-red-50/80 border-red-300 text-red-700 hover:bg-red-100 hover:border-red-400 backdrop-blur-sm"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Citation Count Badge - positioned like in your image */}
                        <div className="absolute bottom-3 left-3">
                          <Badge className="bg-blue-600 text-white border-blue-500 backdrop-blur-sm text-xs">
                            💬 {paper.citation_count || 0}
                          </Badge>
                        </div>
                      </div>

                      {/* Card Footer - Compact like in your image */}
                      <div className="p-4 bg-white">
                        <div className="space-y-2">
                          {/* Title - matches your image layout */}
                          <h3 className="text-lg font-semibold text-black leading-tight line-clamp-2 group-hover:text-gray-700 transition-colors">
                            <Link
                              to={`/research-papers/${paper.content_id}`}
                              className="hover:underline"
                            >
                              {paper.title}
                            </Link>
                          </h3>

                          {/* Authors with circular avatars - exactly like your image */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex -space-x-1">
                                {paper.authors.split(',').slice(0, 4).map((author, index) => (
                                  <div
                                    key={index}
                                    className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-white flex items-center justify-center text-xs text-white font-medium"
                                  >
                                    {author.trim().charAt(0)}
                                  </div>
                                ))}
                                {paper.authors.split(',').length > 4 && (
                                  <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white flex items-center justify-center text-xs text-gray-700">
                                    +{paper.authors.split(',').length - 4}
                                  </div>
                                )}
                              </div>
                              <span className="text-sm text-gray-600">
                                {paper.authors.split(',').length} authors
                              </span>
                            </div>

                            {/* Comments/Citations badge - like in your image */}
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="border-blue-500 text-blue-600 bg-blue-50">
                                💬 {paper.citation_count || 6}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResearchPapers;
