import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BookOpen,
  Briefcase,
  Users,
  Eye,
  TrendingUp,
  Plus,
  Edit,
  BarChart3,
  Shield,
  Activity,
  Calendar,
  Clock,
  Target,
  Zap,
  Award,
  FileText,
  PenTool,
  Settings,
  ArrowUpRight,
  ChevronRight,
  MapPin,
  User,
  Mail,
  ExternalLink,
  Building,
  CheckCircle,
  XCircle,
  AlertCircle,
  StickyNote,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { editorApi, contentApi, EditorAnalytics, AdminAnalytics, JobApplication, InternshipApplication } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ContentAnalytics from '@/components/ContentAnalytics';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import PageTransition from '@/components/ui/page-transition';
import ProfessionalLoading from '@/components/ui/professional-loading';
import { formatDistanceToNow } from 'date-fns';

// Combined application type for the dashboard
type CombinedApplication = (JobApplication | InternshipApplication) & {
  type: 'Job' | 'Internship';
  position: string;
  company: string;
};

const EditorDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<EditorAnalytics | null>(null);
  const [enhancedAnalytics, setEnhancedAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState<'overview' | 'analytics'>('overview');
  const [applications, setApplications] = useState<CombinedApplication[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<CombinedApplication | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';

  // Debug active view changes
  useEffect(() => {
    console.log('Active view changed to:', activeView);
  }, [activeView]);

  // Fetch analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const data = await editorApi.getAnalytics();
        setAnalytics(data);
      } catch (error: any) {
        console.error('Error fetching analytics:', error);
        toast({
          title: 'Error',
          description: 'Failed to load analytics data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [toast]);

  // Fetch applications data
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setApplicationsLoading(true);

        // Fetch both job and internship applications using the API client
        const [jobAppsResponse, internshipAppsResponse] = await Promise.all([
          contentApi.getEditorJobApplications(),
          contentApi.getEditorInternshipApplications(),
        ]);

        // Combine and format applications
        const allApplications: CombinedApplication[] = [];

        if (jobAppsResponse.applications) {
          allApplications.push(...jobAppsResponse.applications.map((app) => ({
            ...app,
            type: 'Job' as const,
            position: app.Job_Title,
            company: app.Company_Name,
          } as CombinedApplication)));
        }

        if (internshipAppsResponse.applications) {
          allApplications.push(...internshipAppsResponse.applications.map((app) => ({
            ...app,
            type: 'Internship' as const,
            position: app.Internship_Title,
            company: app.Company_Name,
          } as CombinedApplication)));
        }

        // Sort by application date (most recent first)
        allApplications.sort((a, b) => new Date(b.Application_Date).getTime() - new Date(a.Application_Date).getTime());

        setApplications(allApplications.slice(0, 5)); // Show only latest 5
      } catch (error) {
        console.error('Error fetching applications:', error);
        toast({
          title: 'Error',
          description: 'Failed to load applications data',
          variant: 'destructive',
        });
      } finally {
        setApplicationsLoading(false);
      }
    };

    fetchApplications();
  }, [toast]);

  const fetchEnhancedAnalytics = async () => {
    if (enhancedAnalytics) return;

    try {
      setLoading(true);
      const data = await editorApi.getEnhancedAnalytics();
      setEnhancedAnalytics(data);
    } catch (error: any) {
      console.error('Error fetching enhanced analytics:', error);
      toast({
        title: 'Error',
        description: 'Failed to load enhanced analytics data',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const handleStatusUpdate = async (applicationId: number, newStatus: string) => {
    try {
      const application = applications.find(app => app.Application_ID === applicationId);
      if (!application) return;

      if (application.type === 'Job') {
        await contentApi.updateJobApplicationStatus(applicationId, { status: newStatus });
      } else if (application.type === 'Internship') {
        await contentApi.updateInternshipApplicationStatus(applicationId, { status: newStatus });
      }

      toast({
        title: "Status Updated",
        description: `Application status updated to ${newStatus}`,
      });

      // Update the application in the local state
      setApplications(prev => prev.map(app =>
        app.Application_ID === applicationId
          ? { ...app, Status: newStatus }
          : app
      ));

      // Update selected application if it's the one being updated
      if (selectedApplication?.Application_ID === applicationId) {
        setSelectedApplication(prev => prev ? { ...prev, Status: newStatus } : null);
      }

    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update application status",
        variant: "destructive",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return 'secondary';
      case 'reviewed': return 'outline';
      case 'shortlisted': return 'default';
      case 'rejected': return 'destructive';
      case 'hired':
      case 'selected': return 'default';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending': return <Clock className="h-3 w-3" />;
      case 'reviewed': return <Eye className="h-3 w-3" />;
      case 'shortlisted': return <CheckCircle className="h-3 w-3" />;
      case 'rejected': return <XCircle className="h-3 w-3" />;
      case 'hired':
      case 'selected': return <CheckCircle className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'published':
      case 'active':
        return 'bg-green-100 text-green-700 border-0';
      case 'draft':
        return 'bg-legal-gold/10 text-legal-gold border-0';
      case 'new':
        return 'bg-legal-navy/10 text-legal-navy border-0';
      case 'under review':
        return 'bg-orange-100 text-orange-700 border-0';
      default:
        return 'bg-legal-gray/10 text-legal-gray-dark border-0';
    }
  };

  const getContentStats = () => {
    if (!analytics) return [];

    return [
      {
        title: 'Blog Posts',
        value: analytics.content_stats.blog_posts.total_count,
        icon: BookOpen,
        color: 'text-legal-navy',
        description: `${analytics.content_stats.blog_posts.total_views} total views`,
      },
      {
        title: 'Job Postings',
        value: analytics.content_stats.job_postings.total_count,
        icon: Briefcase,
        color: 'text-legal-gold',
        description: `${analytics.content_stats.job_postings.total_views} total views`,
      },
      {
        title: 'Applications',
        value: analytics.applications.total,
        icon: Users,
        color: 'text-legal-burgundy',
        description: `${analytics.applications.pending} pending`,
      },
      {
        title: 'Engagement',
        value: analytics.engagement_metrics.total_likes + analytics.engagement_metrics.total_shares,
        icon: TrendingUp,
        color: 'text-legal-gray',
        description: 'Total interactions',
      },
    ];
  };

  const getPerformanceMetrics = () => {
    if (!analytics) return null;

    const totalViews = analytics.content_stats.blog_posts.total_views + analytics.content_stats.job_postings.total_views;
    const totalLikes = analytics.engagement_metrics.total_likes;
    const totalShares = analytics.engagement_metrics.total_shares;
    const totalApplications = analytics.applications.total;

    return {
      totalViews,
      totalLikes,
      totalShares,
      totalApplications,
      engagementRate: totalViews > 0 ? ((totalLikes + totalShares) / totalViews * 100).toFixed(1) : '0',
      avgTimeSpent: analytics.engagement_metrics.avg_time_spent || 0,
      bounceRate: analytics.engagement_metrics.avg_bounce_rate || 0
    };
  };

  const getRecentContent = () => {
    if (!analytics) return [];

    const content = [];

    // Add blog posts
    if (analytics.content_stats.blog_posts.recent_posts) {
      content.push(...analytics.content_stats.blog_posts.recent_posts.map(post => ({
        id: post.Content_ID,
        title: post.Title,
        type: 'blog',
        status: post.Status,
        views: post.views || 0,
        comments: post.comments || 0,
        applications: 0,
        publishedDate: post.Created_At.split('T')[0],
      })));
    }

    // Add job postings
    if (analytics.content_stats.job_postings.recent_posts) {
      content.push(...analytics.content_stats.job_postings.recent_posts.map(job => ({
        id: job.Content_ID,
        title: job.Title,
        type: 'job',
        status: job.Status,
        views: job.views || 0,
        comments: 0,
        applications: job.applications || 0,
        publishedDate: job.Created_At.split('T')[0],
      })));
    }

    return content.sort((a, b) => new Date(b.publishedDate).getTime() - new Date(a.publishedDate).getTime()).slice(0, 5);
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[500px]">
          <ProfessionalLoading
            size="lg"
            text="Loading dashboard analytics..."
            variant="scales"
          />
        </div>
      </PageTransition>
    );
  }

  // Check permissions
  if (!user || (user.role !== 'Editor' && user.role !== 'Admin')) {
    return (
      <PageTransition>
        <div className="flex items-center justify-center min-h-[500px]">
          <Card className="max-w-md mx-auto text-center p-8 border-legal-burgundy/20">
            <CardContent className="space-y-4">
              <div className="p-4 rounded-full bg-legal-burgundy/10 w-fit mx-auto">
                <Shield className="h-8 w-8 text-legal-burgundy" />
              </div>
              <h2 className="text-2xl font-bold text-legal-navy legal-heading">Access Denied</h2>
              <p className="text-legal-gray legal-text">
                You need Editor or Admin permissions to view this dashboard.
              </p>
              <Button asChild className="bg-legal-navy hover:bg-legal-navy-dark professional-button">
                <Link to="/dashboard">Go to User Dashboard</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }

  const contentStats = getContentStats();
  const performanceMetrics = getPerformanceMetrics();
  const recentContent = getRecentContent();

  return (
    <PageTransition>
      <div className="space-y-8 professional-fade-in">
        {/* Black & White Header Section */}
        <div className="relative overflow-hidden">
          <div className="bg-gradient-to-br from-black via-gray-900 to-gray-800 rounded-2xl p-8 text-white shadow-2xl border border-gray-700">
            <div className="relative z-10">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20">
                      {isAdmin ? <Shield className="h-10 w-10" /> : <PenTool className="h-10 w-10" />}
                    </div>
                    <div>
                      <h1 className="text-5xl modern-display mb-2 text-white">
                        {isAdmin ? 'Command Center' : 'Content Studio'}
                      </h1>
                      <p className="text-gray-300 text-xl">
                        {isAdmin
                          ? 'Comprehensive platform oversight and analytics'
                          : 'Create, manage, and optimize your legal content'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                {/* Quick Stats in Header */}
                {performanceMetrics && (
                  <div className="hidden xl:flex items-center gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{formatNumber(performanceMetrics.totalViews)}</div>
                      <div className="text-sm text-gray-400">Total Views</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{performanceMetrics.engagementRate}%</div>
                      <div className="text-sm text-gray-400">Engagement</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-white">{performanceMetrics.totalApplications}</div>
                      <div className="text-sm text-gray-400">Applications</div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-5">
              <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-white/10 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-white/5 to-transparent rounded-full translate-y-32 -translate-x-32"></div>
            </div>
          </div>
        </div>

        {/* Black & White Navigation Pills - Only for Admins */}
        {isAdmin && (
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 p-1 bg-gray-900 rounded-2xl border border-gray-700">
              {[
                { id: 'overview', label: 'Overview', icon: BarChart3 },
                { id: 'analytics', label: 'Analytics', icon: TrendingUp },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log('Tab clicked:', tab.id, 'Current active:', activeView);
                    setActiveView(tab.id as 'overview' | 'analytics');
                    if (tab.id === 'analytics' && isAdmin && !enhancedAnalytics) {
                      fetchEnhancedAnalytics();
                    }
                  }}
                  className={`relative flex items-center gap-2 px-6 py-3 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer z-10 ${
                    activeView === tab.id
                      ? 'bg-white text-black shadow-lg ring-2 ring-gray-300'
                      : 'text-gray-300 hover:text-white hover:bg-gray-800'
                  }`}
                  style={{ pointerEvents: 'auto' }}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                  
                </button>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              {/* Debug info */}
              

              <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white border border-gray-700 shadow-md">
                <Link to="/blogs/create">
                  <Plus className="h-4 w-4 mr-2" />
                  Create Content
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm" className="border-gray-600 text-black hover:bg-gray-800 hover:text-white">
                <Link to="/admin">
                  <Settings className="h-4 w-4 mr-2" />
                  Admin Panel
                </Link>
              </Button>
            </div>
          </div>
        )}

        {/* Quick Actions for Editors Only */}
        {!isAdmin && (
          <div className="flex justify-end mb-6">
            <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white border border-gray-700 shadow-md">
              <Link to="/blogs/create">
                <Plus className="h-4 w-4 mr-2" />
                Create Content
              </Link>
            </Button>
          </div>
        )}

        {/* Dynamic Content Based on Active View */}
        {(activeView === 'overview' || !isAdmin) && (
          <div className="space-y-8">
            {/* Performance Metrics Grid - Consistent Card Design */}
            {performanceMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Total Views',
                    value: formatNumber(performanceMetrics.totalViews),
                    icon: Eye,
                    gradient: 'from-gray-800 to-black',
                    bgColor: 'bg-gray-100',
                    iconColor: 'text-gray-800',
                    trend: '+12%',
                    description: 'vs last month'
                  },
                  {
                    title: 'Engagement Rate',
                    value: `${performanceMetrics.engagementRate}%`,
                    icon: TrendingUp,
                    gradient: 'from-gray-700 to-gray-900',
                    bgColor: 'bg-gray-200',
                    iconColor: 'text-gray-700',
                    trend: '+5.2%',
                    description: 'vs last month'
                  },
                  {
                    title: 'Applications',
                    value: performanceMetrics.totalApplications.toString(),
                    icon: Users,
                    gradient: 'from-black to-gray-800',
                    bgColor: 'bg-gray-50',
                    iconColor: 'text-black',
                    trend: '+8%',
                    description: 'vs last month'
                  },
                  {
                    title: 'Avg. Time Spent',
                    value: `${Math.round(performanceMetrics.avgTimeSpent)}m`,
                    icon: Clock,
                    gradient: 'from-gray-600 to-gray-800',
                    bgColor: 'bg-gray-100',
                    iconColor: 'text-gray-600',
                    trend: '+2.1%',
                    description: 'vs last month'
                  }
                ].map((metric, index) => (
                  <Card key={index} className="relative overflow-hidden border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 group bg-white">
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                    <CardContent className="p-6 relative">
                      <div className="flex items-start justify-between mb-4">
                        <div className={`p-3 rounded-2xl ${metric.bgColor} group-hover:scale-110 transition-transform duration-300 border border-gray-300`}>
                          <metric.icon className={`h-6 w-6 ${metric.iconColor}`} />
                        </div>
                        <Badge className="bg-gray-100 text-gray-800 border border-gray-300 text-xs font-semibold px-2 py-1">
                          {metric.trend}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600 modern-subtitle">{metric.title}</p>
                        <p className="text-3xl font-bold text-black modern-display">{metric.value}</p>
                        <p className="text-xs text-gray-500">{metric.description}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* 2x2 Grid Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Row 1: Performance Trends (Large) + Quick Actions (Small) */}
              <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white">
                  <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300">
                        <TrendingUp className="h-6 w-6 text-gray-800" />
                      </div>
                      <div>
                        <CardTitle className="text-xl text-black modern-heading">Performance Trends</CardTitle>
                        <CardDescription className="text-gray-600 mt-1">Content engagement over the last 30 days</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="h-64 bg-gradient-to-br from-gray-50/50 to-white rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics?.trending_content?.slice(0, 7) || []}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                          <XAxis
                            dataKey="Created_At"
                            stroke="#64748b"
                            fontSize={11}
                            tickFormatter={(value) => new Date(value).toLocaleDateString()}
                          />
                          <YAxis stroke="#64748b" fontSize={11} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'white',
                              border: 'none',
                              borderRadius: '12px',
                              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)'
                            }}
                          />
                          <Area
                            type="monotone"
                            dataKey="views"
                            stroke="#3b82f6"
                            fill="url(#colorGradient)"
                            strokeWidth={3}
                          />
                          <defs>
                            <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                            </linearGradient>
                          </defs>
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white">
                  <CardHeader className="pb-6 bg-gradient-to-r from-gray-100 to-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300">
                        <Zap className="h-6 w-6 text-gray-800" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-black modern-heading">Quick Actions</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {[
                        { label: 'Write Blog', icon: BookOpen, href: '/blogs/create', bgColor: 'bg-gray-100', iconColor: 'text-gray-800' },
                        { label: 'Post Job', icon: Briefcase, href: '/jobs/create', bgColor: 'bg-gray-200', iconColor: 'text-gray-700' },
                        { label: 'Post Internship', icon: Users, href: '/internships/create', bgColor: 'bg-gray-50', iconColor: 'text-black' },
                        { label: 'View Apps', icon: Target, href: '/applications', bgColor: 'bg-gray-100', iconColor: 'text-gray-600' },
                      ].map((action, index) => (
                        <Button
                          key={index}
                          asChild
                          variant="ghost"
                          className="w-full justify-start h-auto p-3 hover:bg-gray-100 group border border-gray-200"
                        >
                          <Link to={action.href} className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${action.bgColor} group-hover:scale-110 transition-transform duration-200 border border-gray-300`}>
                              <action.icon className={`h-4 w-4 ${action.iconColor}`} />
                            </div>
                            <span className="font-medium text-gray-700 group-hover:text-black text-sm">{action.label}</span>
                          </Link>
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Row 2: Recent Content (Large) + Engagement (Small) */}
              <div className="lg:col-span-2">
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white">
                  <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300">
                          <FileText className="h-6 w-6 text-gray-800" />
                        </div>
                        <div>
                          <CardTitle className="text-xl text-black modern-heading">Recent Content</CardTitle>
                          <CardDescription className="text-gray-600 mt-1">Your latest publications and posts</CardDescription>
                        </div>
                      </div>
                      <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white border border-gray-700 shadow-md">
                        <Link to="/blogs/create">
                          <Plus className="h-4 w-4 mr-2" />
                          Create
                        </Link>
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      {recentContent.length > 0 ? recentContent.slice(0, 3).map((content) => (
                        <div
                          key={content.id}
                          className="group flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-black mb-1 modern-subtitle group-hover:text-gray-700 transition-colors">{content.title}</h4>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <span className="flex items-center gap-1.5">
                                <Eye className="h-3.5 w-3.5" />
                                {content.views}
                              </span>
                              {content.type === 'blog' && (
                                <span className="flex items-center gap-1.5">
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  {content.comments}
                                </span>
                              )}
                              <span className="text-gray-400">{content.publishedDate}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge className="bg-gray-100 text-gray-800 border border-gray-300 font-medium">
                              {content.status}
                            </Badge>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-8">
                          <div className="p-4 rounded-full bg-gray-100 border border-gray-300 w-fit mx-auto mb-4">
                            <FileText className="h-8 w-8 text-gray-600" />
                          </div>
                          <p className="font-semibold text-black mb-2">No content yet</p>
                          <p className="text-sm text-gray-500">Start creating your first blog post!</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 h-full bg-white">
                  <CardHeader className="pb-6 bg-gradient-to-r from-gray-100 to-gray-200">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300">
                        <Activity className="h-6 w-6 text-gray-800" />
                      </div>
                      <div>
                        <CardTitle className="text-lg text-black modern-heading">Engagement</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="text-xl font-bold text-black modern-display">
                          {analytics?.engagement_metrics.total_likes || 0}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mt-1">Likes</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-gray-100 border border-gray-300">
                        <div className="text-xl font-bold text-black modern-display">
                          {analytics?.engagement_metrics.total_shares || 0}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mt-1">Shares</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-gray-200 border border-gray-400">
                        <div className="text-xl font-bold text-black modern-display">
                          {Math.round(analytics?.engagement_metrics.avg_time_spent || 0)}s
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mt-1">Time</div>
                      </div>
                      <div className="text-center p-3 rounded-xl bg-gray-50 border border-gray-200">
                        <div className="text-xl font-bold text-black modern-display">
                          {Math.round(analytics?.engagement_metrics.avg_bounce_rate || 0)}%
                        </div>
                        <div className="text-xs text-gray-600 font-semibold mt-1">Bounce</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Full-Width Applications Management Card */}
            <Card className="border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300 bg-white">
              <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-2xl bg-white shadow-md border border-gray-300">
                      <Users className="h-6 w-6 text-gray-800" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-black modern-heading">Application Management</CardTitle>
                      <CardDescription className="text-gray-600 mt-1">Recent applications received on your job and internship posts</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-6 text-sm">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black modern-display">
                          {applications.filter(app => app.type === 'Job').length}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">Job Apps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black modern-display">
                          {applications.filter(app => app.type === 'Internship').length}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">Internship Apps</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-black modern-display">
                          {applications.filter(app => app.Status === 'pending').length}
                        </div>
                        <div className="text-xs text-gray-600 font-semibold">Pending</div>
                      </div>
                    </div>
                    <Button asChild className="bg-black hover:bg-gray-800 text-white border border-gray-700 shadow-md">
                      <Link to="/admin/applications">
                        View All Applications
                        <ArrowUpRight className="h-4 w-4 ml-2" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {/* Loading State */}
                  {applicationsLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        <span className="text-sm text-gray-500 font-medium">Loading applications...</span>
                      </div>
                    </div>
                  ) : applications.length > 0 ? (
                    /* Real Applications List */
                    applications.map((application) => {
                      // Generate avatar from applicant name
                      const getInitials = (name: string) => {
                        return name.split(' ').map(n => n[0]).join('').toUpperCase();
                      };

                      return (
                        <div
                          key={application.Application_ID}
                          className="group flex items-center justify-between p-5 rounded-xl border border-gray-200 hover:border-gray-400 hover:bg-gray-50 transition-all duration-200"
                        >
                          <div className="flex items-center gap-4 flex-1">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gray-700 to-black flex items-center justify-center text-white font-semibold text-sm border border-gray-300">
                              {getInitials(application.Applicant_Name)}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h4 className="font-semibold text-black modern-subtitle group-hover:text-gray-700 transition-colors">
                                  {application.Applicant_Name}
                                </h4>
                                <Badge className={`text-xs font-medium border ${
                                  application.type === 'Job'
                                    ? 'bg-gray-100 text-gray-800 border-gray-300'
                                    : 'bg-gray-200 text-gray-700 border-gray-400'
                                }`}>
                                  {application.type}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-700 font-medium mb-1">{application.position}</p>
                              <div className="flex items-center gap-4 text-xs text-gray-500">
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(application.Application_Date), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Briefcase className="h-3 w-3" />
                                  {application.company}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {application.Location || 'Remote'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <Badge className={`font-medium border ${
                              application.Status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800 border-yellow-300'
                                : application.Status === 'reviewed'
                                ? 'bg-blue-100 text-blue-800 border-blue-300'
                                : application.Status === 'shortlisted'
                                ? 'bg-green-100 text-green-800 border-green-300'
                                : 'bg-gray-100 text-gray-800 border-gray-300'
                            }`}>
                              {application.Status}
                            </Badge>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 px-3 border-gray-300 text-gray-700 hover:bg-gray-100"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setIsDetailDialogOpen(true);
                                }}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    /* Empty State when no applications */
                    <div className="text-center py-12">
                      <div className="p-4 rounded-full bg-gray-100 border border-gray-300 w-fit mx-auto mb-4">
                        <Users className="h-8 w-8 text-gray-600" />
                      </div>
                      <p className="font-semibold text-black mb-2">No applications yet</p>
                      <p className="text-sm text-gray-500 mb-4">Start posting jobs and internships to receive applications!</p>
                      <div className="flex items-center justify-center gap-3">
                        <Button asChild size="sm" className="bg-black hover:bg-gray-800 text-white">
                          <Link to="/jobs/create">Post Job</Link>
                        </Button>
                        <Button asChild size="sm" variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
                          <Link to="/internships/create">Post Internship</Link>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics View - Only for Admins */}
        {activeView === 'analytics' && isAdmin && (
          <div className="space-y-8">
            {isAdmin && enhancedAnalytics ? (
              <div className="space-y-6">
                {/* Global Stats for Admin */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(enhancedAnalytics.global_content_stats).map(([key, stats]) => (
                    <Card key={key} className="border border-gray-200 shadow-lg">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-black capitalize">
                          {key.replace('_', ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total:</span>
                            <span className="font-bold text-black">{stats.total_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Active:</span>
                            <span className="font-bold text-gray-700">{stats.active_count}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Views:</span>
                            <span className="font-bold text-gray-800">{stats.total_views.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Top Content and Creators */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="border border-gray-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-black">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Award className="h-5 w-5 text-gray-700" />
                        </div>
                        Top Performing Content
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {enhancedAnalytics.top_content.slice(0, 5).map((content, index) => (
                          <div key={content.Content_ID} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                                <h4 className="font-semibold text-sm text-black">{content.Title}</h4>
                              </div>
                              <p className="text-xs text-gray-600">by {content.author_name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{content.views} views</span>
                                <span>{content.likes} likes</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm font-bold text-gray-800">
                                {Number(content.engagement_score || 0).toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">score</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-gray-200 shadow-lg">
                    <CardHeader className="pb-4">
                      <CardTitle className="flex items-center gap-3 text-black">
                        <div className="p-2 rounded-lg bg-gray-100">
                          <Users className="h-5 w-5 text-gray-700" />
                        </div>
                        Top Content Creators
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {enhancedAnalytics.top_creators.slice(0, 5).map((creator, index) => (
                          <div key={creator.User_ID} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-bold text-gray-700">#{index + 1}</span>
                                <h4 className="font-semibold text-sm text-black">{creator.creator_name}</h4>
                              </div>
                              <p className="text-xs text-gray-600">{creator.Role_Name}</p>
                              <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                                <span>{creator.content_count} content</span>
                                <span>{creator.total_views} views</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              <ContentAnalytics />
            )}
          </div>
        )}

        {/* Application Detail Dialog */}
        <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Application Details</DialogTitle>
              <DialogDescription>
                Detailed view of the application with all information and actions.
              </DialogDescription>
            </DialogHeader>

            {selectedApplication && (
              <div className="space-y-6">
                {/* Applicant Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Applicant Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{selectedApplication.Applicant_Name}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.Applicant_Email}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>Applied on {new Date(selectedApplication.Application_Date).toLocaleDateString()}</span>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Position Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{selectedApplication.position}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Building className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.company}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <MapPin className="h-4 w-4 text-gray-500" />
                        <span>{selectedApplication.Location || 'Remote'}</span>
                      </div>
                      <Badge variant="outline" className="w-fit">
                        {selectedApplication.type}
                      </Badge>
                    </CardContent>
                  </Card>
                </div>

                {/* Resume */}
                {selectedApplication.Resume_URL && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Resume</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Button
                        onClick={() => window.open(selectedApplication.Resume_URL, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View Resume
                      </Button>
                    </CardContent>
                  </Card>
                )}

                {/* Cover Letter */}
                {selectedApplication.Cover_Letter && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Cover Letter</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="p-4 bg-gray-50 rounded-lg whitespace-pre-wrap">
                        {selectedApplication.Cover_Letter}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Status and Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Status & Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <Label>Current Status:</Label>
                      <Badge variant={getStatusBadgeVariant(selectedApplication.Status)} className="flex items-center gap-1">
                        {getStatusIcon(selectedApplication.Status)}
                        {selectedApplication.Status}
                      </Badge>
                    </div>

                    <div className="flex items-center space-x-4">
                      <Label htmlFor="status-update">Update Status:</Label>
                      <Select
                        value={selectedApplication.Status}
                        onValueChange={(value) => {
                          handleStatusUpdate(selectedApplication.Application_ID, value);
                        }}
                      >
                        <SelectTrigger className="w-48">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Pending">Pending</SelectItem>
                          <SelectItem value="Reviewed">Reviewed</SelectItem>
                          <SelectItem value="Shortlisted">Shortlisted</SelectItem>
                          <SelectItem value="Rejected">Rejected</SelectItem>
                          <SelectItem value={selectedApplication.type === 'Job' ? 'Hired' : 'Selected'}>
                            {selectedApplication.type === 'Job' ? 'Hired' : 'Selected'}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </DialogContent>
        </Dialog>

      </div>
    </PageTransition>
  );
};

export default EditorDashboard;