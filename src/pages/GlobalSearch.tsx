import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AdvancedSearch, { SearchFilters } from '@/components/AdvancedSearch';
import { contentApi } from '@/services/api';
import {
  Search,
  FileText,
  BookOpen,
  Briefcase,
  GraduationCap,
  Calendar,
  User,
  ExternalLink,
  MessageSquare,
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'blog' | 'research' | 'job' | 'internship';
  title: string;
  summary: string;
  author: string;
  date: string;
  category?: string;
  tags: string[];
  url: string;
  metadata?: {
    comments?: number;
    citations?: number;
    salary?: string;
    location?: string;
    deadline?: string;
  };
}

const GlobalSearch = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [activeTab, setActiveTab] = useState('all');

  const initialQuery = searchParams.get('q') || '';

  useEffect(() => {
    if (initialQuery) {
      handleSearch({
        query: initialQuery,
        contentType: [],
        category: [],
        tags: [],
        author: '',
        dateRange: { from: '', to: '' },
        sortBy: 'relevance',
        sortOrder: 'desc',
      });
    }
  }, [initialQuery]);

  const handleSearch = async (filters: SearchFilters) => {
    if (!filters.query.trim() && filters.contentType.length === 0 && filters.category.length === 0) {
      setResults([]);
      setTotalResults(0);
      return;
    }

    setLoading(true);
    try {
      // Update URL with search query
      if (filters.query) {
        setSearchParams({ q: filters.query });
      }

      // Simulate API calls to different content types
      const searchPromises = [];

      // Search blog posts
      if (filters.contentType.length === 0 || filters.contentType.includes('Blog Posts')) {
        searchPromises.push(
          contentApi.getBlogPosts({
            category: filters.category.length > 0 ? filters.category[0] : undefined,
          }).then(response => 
            response.blog_posts.map(post => ({
              id: `blog-${post.content_id}`,
              type: 'blog' as const,
              title: post.title,
              summary: post.summary,
              author: post.author_name,
              date: post.publication_date || post.created_at,
              category: post.category,
              tags: post.tags ? post.tags.split(',').map(t => t.trim()) : [],
              url: `/blogs/${post.content_id}`,
              metadata: {
                comments: post.comment_count,
              },
            }))
          ).catch(() => [])
        );
      }

      // Search research papers
      if (filters.contentType.length === 0 || filters.contentType.includes('Research Papers')) {
        searchPromises.push(
          contentApi.getResearchPapers({
            keywords: filters.query,
            author: filters.author,
          }).then(response =>
            response.research_papers.map(paper => ({
              id: `research-${paper.content_id}`,
              type: 'research' as const,
              title: paper.title,
              summary: paper.abstract,
              author: paper.authors,
              date: paper.publication_date || paper.created_at,
              category: 'Research',
              tags: paper.keywords ? paper.keywords.split(',').map(t => t.trim()) : [],
              url: `/research/${paper.content_id}`,
              metadata: {
                citations: paper.citation_count,
              },
            }))
          ).catch(() => [])
        );
      }

      // Search jobs
      if (filters.contentType.length === 0 || filters.contentType.includes('Jobs')) {
        searchPromises.push(
          contentApi.getJobs().then(response =>
            response.jobs.map(job => ({
              id: `job-${job.job_id}`,
              type: 'job' as const,
              title: job.title,
              summary: job.summary,
              author: job.author_name,
              date: job.created_at,
              category: 'Jobs',
              tags: job.tags ? job.tags.split(',').map(t => t.trim()) : [],
              url: `/jobs/${job.job_id}`,
              metadata: {
                salary: job.salary_range,
                location: job.location,
                deadline: job.application_deadline,
              },
            }))
          ).catch(() => [])
        );
      }

      // Search internships
      if (filters.contentType.length === 0 || filters.contentType.includes('Internships')) {
        searchPromises.push(
          contentApi.getInternships().then(response =>
            response.internships.map(internship => ({
              id: `internship-${internship.internship_id}`,
              type: 'internship' as const,
              title: internship.title,
              summary: internship.summary,
              author: internship.author_name,
              date: internship.created_at,
              category: 'Internships',
              tags: internship.tags ? internship.tags.split(',').map(t => t.trim()) : [],
              url: `/internships/${internship.internship_id}`,
              metadata: {
                location: internship.location,
                deadline: internship.application_deadline,
              },
            }))
          ).catch(() => [])
        );
      }

      const allResults = await Promise.all(searchPromises);
      const combinedResults = allResults.flat();

      // Filter results based on search query
      const filteredResults = combinedResults.filter(result => {
        if (!filters.query.trim()) return true;
        const searchTerm = filters.query.toLowerCase();
        return (
          result.title.toLowerCase().includes(searchTerm) ||
          result.summary.toLowerCase().includes(searchTerm) ||
          result.author.toLowerCase().includes(searchTerm) ||
          result.tags.some(tag => tag.toLowerCase().includes(searchTerm))
        );
      });

      // Sort results
      const sortedResults = filteredResults.sort((a, b) => {
        switch (filters.sortBy) {
          case 'date':
            return filters.sortOrder === 'desc' 
              ? new Date(b.date).getTime() - new Date(a.date).getTime()
              : new Date(a.date).getTime() - new Date(b.date).getTime();
          case 'title':
            return filters.sortOrder === 'desc'
              ? b.title.localeCompare(a.title)
              : a.title.localeCompare(b.title);
          case 'author':
            return filters.sortOrder === 'desc'
              ? b.author.localeCompare(a.author)
              : a.author.localeCompare(b.author);
          default: // relevance
            return 0;
        }
      });

      setResults(sortedResults);
      setTotalResults(sortedResults.length);
    } catch (error) {
      console.error('Search error:', error);
      setResults([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blog':
        return <FileText className="h-4 w-4" />;
      case 'research':
        return <BookOpen className="h-4 w-4" />;
      case 'job':
        return <Briefcase className="h-4 w-4" />;
      case 'internship':
        return <GraduationCap className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'blog':
        return 'Blog Post';
      case 'research':
        return 'Research Paper';
      case 'job':
        return 'Job';
      case 'internship':
        return 'Internship';
      default:
        return 'Content';
    }
  };

  const filteredResults = activeTab === 'all' 
    ? results 
    : results.filter(result => result.type === activeTab);

  const resultCounts = {
    all: results.length,
    blog: results.filter(r => r.type === 'blog').length,
    research: results.filter(r => r.type === 'research').length,
    job: results.filter(r => r.type === 'job').length,
    internship: results.filter(r => r.type === 'internship').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Global Search</h1>
        <p className="text-gray-600 mt-2">
          Search across all content types including blog posts, research papers, jobs, and internships
        </p>
      </div>

      {/* Advanced Search */}
      <AdvancedSearch
        onSearch={handleSearch}
        placeholder="Search across all content..."
        className="mb-6"
      />

      {/* Results */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              </CardHeader>
            </Card>
          ))}
        </div>
      ) : results.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {initialQuery ? 'No results found' : 'Start searching'}
            </h3>
            <p className="text-gray-600">
              {initialQuery 
                ? 'Try adjusting your search terms or filters.'
                : 'Enter a search term to find content across the platform.'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Found {totalResults} result{totalResults !== 1 ? 's' : ''}
            </p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="bg-white border-2 border-gray-100 rounded-2xl p-6 shadow-xl mb-8">
              <div className="flex flex-wrap gap-3 justify-center">
                <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="all"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <Search className="h-4 w-4" />
                    All ({resultCounts.all})
                  </TabsTrigger>
                  <TabsTrigger
                    value="blog"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <FileText className="h-4 w-4" />
                    Blog Posts ({resultCounts.blog})
                  </TabsTrigger>
                  <TabsTrigger
                    value="research"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <BookOpen className="h-4 w-4" />
                    Research ({resultCounts.research})
                  </TabsTrigger>
                </TabsList>

                <TabsList className="inline-flex h-auto bg-gray-100 p-1 rounded-xl">
                  <TabsTrigger
                    value="job"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <Briefcase className="h-4 w-4" />
                    Jobs ({resultCounts.job})
                  </TabsTrigger>
                  <TabsTrigger
                    value="internship"
                    className="flex items-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-lg data-[state=active]:bg-black data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 whitespace-nowrap"
                  >
                    <GraduationCap className="h-4 w-4" />
                    Internships ({resultCounts.internship})
                  </TabsTrigger>
                </TabsList>
              </div>
            </div>

            <TabsContent value={activeTab} className="space-y-4 mt-4">
              {filteredResults.map((result) => (
                <Card key={result.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {getTypeIcon(result.type)}
                          <Badge variant="outline">{getTypeLabel(result.type)}</Badge>
                          {result.category && (
                            <Badge variant="secondary">{result.category}</Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl mb-2">
                          <Link 
                            to={result.url}
                            className="hover:text-primary transition-colors"
                          >
                            {result.title}
                          </Link>
                        </CardTitle>
                        <CardDescription className="text-base mb-3">
                          {result.summary}
                        </CardDescription>
                        <div className="flex items-center gap-4 text-sm text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {result.author}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(result.date).toLocaleDateString()}
                          </span>
                          {result.metadata?.comments && (
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {result.metadata.comments} comments
                            </span>
                          )}
                          {result.metadata?.citations && (
                            <span>{result.metadata.citations} citations</span>
                          )}
                          {result.metadata?.location && (
                            <span>{result.metadata.location}</span>
                          )}
                        </div>
                        {result.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {result.tags.slice(0, 5).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                            {result.tags.length > 5 && (
                              <Badge variant="outline" className="text-xs">
                                +{result.tags.length - 5}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={result.url}>
                          View
                          <ExternalLink className="h-4 w-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default GlobalSearch;
