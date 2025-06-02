import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { contentApi, BlogPost, ResearchPaper, Note } from '@/services/api';
import {
  BookOpen,
  FileText,
  StickyNote,
  Calendar,
  User,
  ArrowRight,
  TrendingUp,
  Star
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ContentCardProps {
  title: string;
  summary?: string;
  author: string;
  createdAt: string;
  type: 'blog' | 'research' | 'note';
  href: string;
  featured?: boolean;
  tags?: string;
  className?: string;
  coverImage?: string;
}

const ContentCard: React.FC<ContentCardProps> = ({
  title,
  summary,
  author,
  createdAt,
  type,
  href,
  featured = false,
  tags,
  className,
  coverImage
}) => {
  const getTypeIcon = () => {
    switch (type) {
      case 'blog': return BookOpen;
      case 'research': return FileText;
      case 'note': return StickyNote;
      default: return BookOpen;
    }
  };

  const getTypeColor = () => {
    switch (type) {
      case 'blog': return 'bg-blue-100 text-blue-800';
      case 'research': return 'bg-green-100 text-green-800';
      case 'note': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const TypeIcon = getTypeIcon();
  const tagList = tags ? tags.split(',').map(tag => tag.trim()).slice(0, 2) : [];

  return (
    <Card className={cn(
      "group cursor-pointer border-2 border-gray-100 hover:border-gray-900 transition-all duration-500 hover:shadow-2xl bg-white overflow-hidden",
      "hover:-translate-y-2 transform-gpu",
      className
    )}>
      {/* Cover Image */}
      {coverImage && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={coverImage}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
          {featured && (
            <Badge className="absolute top-4 right-4 bg-gradient-to-r from-yellow-400 to-yellow-600 text-black text-xs font-bold px-3 py-1">
              <Star className="w-3 h-3 mr-1 fill-current" />
              Featured
            </Badge>
          )}
        </div>
      )}

      <CardHeader className="pb-4">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-gray-900 to-black border border-gray-200 group-hover:scale-110 transition-transform duration-300">
              <TypeIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex flex-col gap-2">
              <Badge variant="secondary" className={cn("text-xs font-semibold px-3 py-1", getTypeColor())}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Badge>
              
            </div>
          </div>
        </div>

        <CardTitle className="text-xl font-bold text-black group-hover:text-gray-900 transition-colors line-clamp-2 leading-tight">
          {title}
        </CardTitle>

        {summary && (
          <CardDescription className="text-gray-700 line-clamp-3 leading-relaxed font-medium">
            {summary}
          </CardDescription>
        )}
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4 font-medium">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-semibold">{author}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            <span>{format(new Date(createdAt), 'MMM dd, yyyy')}</span>
          </div>
        </div>

        {tagList.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {tagList.map((tag, index) => (
              <Badge key={index} variant="outline" className="text-xs font-medium border-gray-300 hover:border-gray-900 transition-colors">
                {tag}
              </Badge>
            ))}
          </div>
        )}

        <Link to={href}>
          <Button variant="ghost" className="w-full justify-between group-hover:bg-gray-900 group-hover:text-white transition-all duration-300 font-semibold py-3 rounded-xl border border-gray-200 group-hover:border-gray-900">
            Read Full Article
            <ArrowRight className="h-4 w-4 group-hover:translate-x-2 transition-transform duration-300" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

const FeaturedContent = () => {
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        
        // Fetch featured/recent content
        const [blogsResponse, researchResponse, notesResponse] = await Promise.all([
          contentApi.getBlogPosts({ limit: 3, status: 'Active' }),
          contentApi.getResearchPapers({ limit: 3 }),
          contentApi.getNotes({ limit: 3, sort_by: 'recent' })
        ]);

        setBlogPosts(blogsResponse.blog_posts || []);
        setResearchPapers(researchResponse.research_papers || []);
        setNotes(notesResponse.notes || []);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  const ContentSkeleton = () => (
    <Card className="border border-gray-200">
      <CardHeader>
        <div className="flex items-center gap-3 mb-3">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-5 w-20" />
        </div>
        <Skeleton className="h-6 w-full mb-2" />
        <Skeleton className="h-4 w-3/4" />
      </CardHeader>
      <CardContent>
        <div className="flex justify-between mb-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  );

  return (
    <section className="py-24 bg-gradient-to-br from-gray-50 via-white to-gray-100/30 relative overflow-hidden">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M20 20c0-5.5-4.5-10-10-10s-10 4.5-10 10 4.5 10 10 10 10-4.5 10-10zm10 0c0 5.5 4.5 10 10 10s10-4.5 10-10-4.5-10-10-10-10 4.5-10 10z'/%3E%3C/g%3E%3C/svg%3E")`
      }} />

      <div className="container mx-auto px-4 relative z-10">
        {/* Professional Section Header */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-3 bg-gradient-to-r from-gray-900 to-black text-white px-8 py-3 rounded-2xl text-sm font-bold mb-8 shadow-lg">
            <TrendingUp className="w-5 h-5" />
            Curated Legal Content
          </div>
          <h2 className="text-5xl md:text-6xl font-black text-black mb-8 tracking-tight leading-tight">
            Discover Legal Excellence
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-gray-900 to-black mx-auto mb-8" />
          <p className="text-xl md:text-2xl text-gray-700 max-w-4xl mx-auto font-light leading-relaxed">
            Explore our meticulously curated collection of legal insights, scholarly research, and professional resources
            crafted by distinguished industry experts and thought leaders.
          </p>
        </div>

        {/* Content Sections */}
        <div className="space-y-16">
          {/* Blog Posts */}
          <div>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-900 to-black shadow-xl border border-gray-200">
                  <BookOpen className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-black tracking-tight">Latest Publications</h3>
                  <p className="text-gray-700 text-lg font-medium">Expert insights and analysis from legal professionals</p>
                </div>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 px-6 py-3 rounded-xl font-semibold">
                <Link to="/blogs">
                  View All Publications
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <ContentSkeleton key={index} />
                ))
              ) : (
                blogPosts.map((post) => (
                  <ContentCard
                    key={post.content_id}
                    title={post.title}
                    summary={post.summary}
                    author={post.author_name}
                    createdAt={post.created_at}
                    type="blog"
                    href={`/blogs/${post.content_id}`}
                    featured={post.is_featured}
                    tags={post.tags}
                    coverImage={post.featured_image}
                  />
                ))
              )}
            </div>
          </div>

          {/* Research Papers */}
          <div>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-gray-800 to-gray-900 shadow-xl border border-gray-200">
                  <FileText className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-black tracking-tight">Scholarly Research</h3>
                  <p className="text-gray-700 text-lg font-medium">Peer-reviewed research and academic publications</p>
                </div>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 px-6 py-3 rounded-xl font-semibold">
                <Link to="/research">
                  View All Research
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <ContentSkeleton key={index} />
                ))
              ) : (
                researchPapers.map((paper) => (
                  <ContentCard
                    key={paper.content_id}
                    title={paper.title}
                    summary={paper.abstract}
                    author={paper.author_name}
                    createdAt={paper.created_at}
                    type="research"
                    href={`/research/${paper.content_id}`}
                    featured={paper.is_featured}
                    tags={paper.keywords}
                    coverImage={paper.featured_image}
                  />
                ))
              )}
            </div>
          </div>

          {/* Notes */}
          <div>
            <div className="flex items-center justify-between mb-12">
              <div className="flex items-center gap-6">
                <div className="p-4 rounded-3xl bg-gradient-to-br from-black to-gray-800 shadow-xl border border-gray-200">
                  <StickyNote className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-black tracking-tight">Professional Insights</h3>
                  <p className="text-gray-700 text-lg font-medium">Quick insights and expert professional tips</p>
                </div>
              </div>
              <Button asChild variant="outline" className="hidden sm:flex border-2 border-gray-900 text-gray-900 hover:bg-gray-900 hover:text-white transition-all duration-300 px-6 py-3 rounded-xl font-semibold">
                <Link to="/notes">
                  View All Insights
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {loading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <ContentSkeleton key={index} />
                ))
              ) : (
                notes.map((note) => (
                  <ContentCard
                    key={note.content_id}
                    title={note.title}
                    summary={note.summary}
                    author={note.author_name}
                    createdAt={note.created_at}
                    type="note"
                    href={`/notes/${note.content_id}`}
                    featured={false}
                    tags={note.category}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedContent;

