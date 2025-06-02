import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Eye,
  Heart,
  MessageSquare,
  Share2,
  Users,
  FileText,
  Calendar,
  Download,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { editorApi } from '@/services/api';

interface ContentMetrics {
  content_id: number;
  title: string;
  content_type: string;
  views: number;
  likes: number;
  shares: number;
  comments: number;
  created_at: string;
  author_name: string;
}

interface AnalyticsData {
  totalViews: number;
  totalLikes: number;
  totalShares: number;
  totalComments: number;
  topContent: ContentMetrics[];
  contentByType: { type: string; count: number; views: number }[];
  dailyViews: { date: string; views: number; likes: number }[];
}

const ContentAnalytics = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [contentType, setContentType] = useState('all');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData>({
    totalViews: 0,
    totalLikes: 0,
    totalShares: 0,
    totalComments: 0,
    topContent: [],
    contentByType: [],
    dailyViews: [],
  });

  useEffect(() => {
    fetchAnalytics();
  }, [timeRange, contentType]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);

      // Fetch real analytics data from the API
      const data = await editorApi.getContentAnalytics({
        timeRange,
        contentType: contentType === 'all' ? undefined : contentType,
      });

      setAnalyticsData(data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast({
        title: "Error",
        description: "Failed to load analytics data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const exportData = () => {
    // Create CSV data
    const csvData = analyticsData.topContent.map(item => ({
      Title: item.title,
      Type: item.content_type,
      Views: item.views,
      Likes: item.likes,
      Shares: item.shares,
      Comments: item.comments,
      Author: item.author_name,
      'Created Date': new Date(item.created_at).toLocaleDateString(),
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0] || {});
    const csvString = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `content-analytics-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: "Analytics data has been exported to CSV.",
    });
  };

  const COLORS = ['#000000', '#374151', '#6b7280', '#9ca3af', '#d1d5db'];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-3/4"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-black">Content Analytics</h2>
          <p className="text-gray-600">Track content performance and engagement metrics</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={contentType} onValueChange={setContentType}>
            <SelectTrigger className="w-40 border-gray-300">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Content</SelectItem>
              <SelectItem value="Blog_Post">Blog Posts</SelectItem>
              <SelectItem value="Research_Paper">Research Papers</SelectItem>
              <SelectItem value="Note">Notes</SelectItem>
              <SelectItem value="Course">Courses</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportData} variant="outline" className="border-gray-300 text-gray-700 hover:bg-gray-100">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Views</p>
                <p className="text-2xl font-bold text-black">{analyticsData.totalViews.toLocaleString()}</p>
              </div>
              <Eye className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Likes</p>
                <p className="text-2xl font-bold text-black">{analyticsData.totalLikes.toLocaleString()}</p>
              </div>
              <Heart className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Shares</p>
                <p className="text-2xl font-bold text-black">{analyticsData.totalShares.toLocaleString()}</p>
              </div>
              <Share2 className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>
        <Card className="border border-gray-200 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Comments</p>
                <p className="text-2xl font-bold text-black">{analyticsData.totalComments.toLocaleString()}</p>
              </div>
              <MessageSquare className="h-8 w-8 text-gray-700" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="bg-gray-100 border border-gray-300">
          <TabsTrigger value="trends" className="data-[state=active]:bg-black data-[state=active]:text-white">Trends</TabsTrigger>
          <TabsTrigger value="content-types" className="data-[state=active]:bg-black data-[state=active]:text-white">Content Types</TabsTrigger>
          <TabsTrigger value="top-content" className="data-[state=active]:bg-black data-[state=active]:text-white">Top Content</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-6">
          <Card className="border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Daily Views and Likes</CardTitle>
              <CardDescription>Track daily engagement over time</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.dailyViews}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  <Line type="monotone" dataKey="views" stroke="#374151" strokeWidth={2} />
                  <Line type="monotone" dataKey="likes" stroke="#6b7280" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="content-types" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Content Distribution</CardTitle>
                <CardDescription>Content count by type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.contentByType}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ type, count }) => `${type}: ${count}`}
                      outerRadius={80}
                      fill="#374151"
                      dataKey="count"
                    >
                      {analyticsData.contentByType.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border border-gray-200 shadow-lg">
              <CardHeader>
                <CardTitle className="text-black">Views by Content Type</CardTitle>
                <CardDescription>Total views per content type</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.contentByType}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="type" stroke="#6b7280" />
                    <YAxis stroke="#6b7280" />
                    <Tooltip contentStyle={{ backgroundColor: 'white', border: '1px solid #d1d5db', borderRadius: '8px' }} />
                    <Bar dataKey="views" fill="#374151" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="top-content" className="space-y-6">
          <Card className="border border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Top Performing Content</CardTitle>
              <CardDescription>Most viewed and engaged content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {analyticsData.topContent.map((content, index) => (
                  <div key={content.content_id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline" className="border-gray-300 text-gray-700 bg-gray-100">{content.content_type.replace('_', ' ')}</Badge>
                        <span className="text-sm text-gray-500">#{index + 1}</span>
                      </div>
                      <h4 className="font-medium text-black">{content.title}</h4>
                      <p className="text-sm text-gray-600">by {content.author_name}</p>
                    </div>
                    <div className="flex items-center gap-6 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{content.views}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{content.likes}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Share2 className="h-4 w-4" />
                        <span>{content.shares}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-4 w-4" />
                        <span>{content.comments}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ContentAnalytics;
