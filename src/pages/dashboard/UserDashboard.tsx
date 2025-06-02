import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  BookOpen,
  Briefcase,
  Users,
  ClipboardList,
  TrendingUp,
  Calendar,
  Bell,
  Star,
  Loader2,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AnimatedWrapper, { StaggeredList, HoverAnimation } from '@/components/ui/animated-wrapper';
import { userApi } from '@/services/api';
import { useToast } from '@/hooks/use-toast';

const UserDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // State for dashboard data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await userApi.getDashboardData();
        setDashboardData(data);
      } catch (error: any) {
        console.error('Error fetching dashboard data:', error);
        toast({
          title: "Error",
          description: "Failed to load dashboard data. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  // Prepare stats data from API response with black & white theme
  const stats = dashboardData ? [
    {
      title: 'Applications Submitted',
      value: dashboardData.stats.applications_submitted.value.toString(),
      icon: ClipboardList,
      description: dashboardData.stats.applications_submitted.description,
      color: 'text-gray-800',
      bgColor: 'bg-gray-100',
    },
    {
      title: 'Courses Enrolled',
      value: dashboardData.stats.courses_enrolled.value.toString(),
      icon: BookOpen,
      description: dashboardData.stats.courses_enrolled.description,
      color: 'text-gray-700',
      bgColor: 'bg-gray-200',
    },
    {
      title: 'Blog Posts Read',
      value: dashboardData.stats.blog_posts_read.value.toString(),
      icon: BookOpen,
      description: dashboardData.stats.blog_posts_read.description,
      color: 'text-black',
      bgColor: 'bg-gray-50',
    },
    {
      title: 'Saved Jobs',
      value: dashboardData.stats.saved_jobs.value.toString(),
      icon: Star,
      description: dashboardData.stats.saved_jobs.description,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
    },
  ] : [];

  const recentApplications = dashboardData?.recent_applications || [];
  const upcomingEvents = dashboardData?.upcoming_events || [];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'under review':
        return 'bg-gray-100 text-gray-800 border border-gray-300';
      case 'interview scheduled':
        return 'bg-gray-200 text-gray-900 border border-gray-400';
      case 'pending':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'accepted':
        return 'bg-gray-800 text-white border border-gray-900';
      case 'rejected':
        return 'bg-gray-300 text-gray-800 border border-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 border border-gray-300';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading dashboard...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 professional-fade-in">
      {/* Black & White Welcome Section */}
      <AnimatedWrapper animation="slideUp">
        <div className="bg-gradient-to-r from-gray-900 via-black to-gray-800 rounded-xl p-8 border border-gray-700 shadow-xl">
          <h1 className="text-3xl font-bold text-white legal-heading">
            Welcome back, {user?.fullName}!
          </h1>
          <p className="text-gray-300 text-lg mt-3 legal-text">
            Here's what's happening with your legal career journey.
          </p>
        </div>
      </AnimatedWrapper>

      {/* Black & White Stats Grid */}
      <StaggeredList
        staggerDelay={100}
        animation="slideUp"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {stats.map((stat, index) => (
          <HoverAnimation key={index} scale={1.02} lift>
            <Card className="professional-card-hover border border-gray-200 shadow-lg bg-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                <CardTitle className="text-sm font-semibold text-gray-700">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.bgColor} border border-gray-300`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-black mb-1">{stat.value}</div>
                <p className="text-sm text-gray-600 legal-text">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          </HoverAnimation>
        ))}
      </StaggeredList>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Black & White Recent Applications */}
        <Card className="professional-card-hover border border-gray-200 shadow-lg bg-white">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
            <CardTitle className="flex items-center gap-3 text-black legal-heading">
              <div className="p-2 rounded-lg bg-gray-100 border border-gray-300">
                <ClipboardList className="h-5 w-5 text-gray-800" />
              </div>
              Recent Applications
            </CardTitle>
            <CardDescription className="legal-text text-gray-600">
              Track your job and internship applications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentApplications.length > 0 ? (
                recentApplications.map((application) => (
                  <div
                    key={application.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-black">{application.position}</h4>
                      <p className="text-sm text-gray-700 font-medium">{application.company}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Applied: {new Date(application.applied_date).toLocaleDateString()}
                      </p>
                    </div>
                    <Badge className={`${getStatusColor(application.status)} font-medium`}>
                      {application.status}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <div className="p-4 rounded-full bg-gray-100 border border-gray-300 w-fit mx-auto mb-4">
                    <ClipboardList className="h-8 w-8 text-gray-600" />
                  </div>
                  <p className="font-medium text-black">No applications yet</p>
                  <p className="text-sm legal-text">Start applying for jobs and internships!</p>
                </div>
              )}
              <Button asChild variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white professional-button">
                <Link to="/applications">View All Applications</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Black & White Upcoming Events */}
        <Card className="professional-card-hover border border-gray-200 shadow-lg bg-white">
          <CardHeader className="pb-4 bg-gradient-to-r from-gray-100 to-gray-200">
            <CardTitle className="flex items-center gap-3 text-black legal-heading">
              <div className="p-2 rounded-lg bg-gray-200 border border-gray-400">
                <Calendar className="h-5 w-5 text-gray-700" />
              </div>
              Upcoming Events
            </CardTitle>
            <CardDescription className="legal-text text-gray-600">
              Don't miss these important events
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-all duration-200"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-black">{event.title}</h4>
                      <p className="text-sm text-gray-700">
                        {new Date(event.date).toLocaleDateString()} at {event.time}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-gray-300 text-gray-700 font-medium">
                      {event.type}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-gray-600">
                  <div className="p-4 rounded-full bg-gray-200 border border-gray-400 w-fit mx-auto mb-4">
                    <Calendar className="h-8 w-8 text-gray-700" />
                  </div>
                  <p className="font-medium text-black">No upcoming events</p>
                  <p className="text-sm legal-text">Events feature coming soon!</p>
                </div>
              )}
              <Button variant="outline" className="w-full border-gray-300 text-gray-700 hover:bg-gray-800 hover:text-white professional-button" disabled={upcomingEvents.length === 0}>
                View All Events
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Black & White Quick Actions */}
      <Card className="professional-card-hover border border-gray-200 shadow-lg bg-white">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-black legal-heading">Quick Actions</CardTitle>
          <CardDescription className="legal-text text-gray-600">
            Common tasks to help you get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Button asChild variant="outline" className="h-auto p-6 border-gray-300 hover:bg-gray-800 hover:text-white professional-button group">
              <Link to="/jobs" className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-gray-100 border border-gray-300 group-hover:bg-white/20 transition-colors">
                  <Briefcase className="h-6 w-6 text-gray-700 group-hover:text-white" />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-white">Browse Jobs</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-6 border-gray-300 hover:bg-gray-800 hover:text-white professional-button group">
              <Link to="/internships" className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-gray-200 border border-gray-400 group-hover:bg-white/20 transition-colors">
                  <Users className="h-6 w-6 text-gray-600 group-hover:text-white" />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-white">Find Internships</span>
              </Link>
            </Button>
            <Button asChild variant="outline" className="h-auto p-6 border-gray-300 hover:bg-gray-800 hover:text-white professional-button group">
              <Link to="/courses" className="flex flex-col items-center gap-3">
                <div className="p-3 rounded-lg bg-gray-50 border border-gray-200 group-hover:bg-white/20 transition-colors">
                  <BookOpen className="h-6 w-6 text-gray-500 group-hover:text-white" />
                </div>
                <span className="font-semibold text-gray-800 group-hover:text-white">Explore Courses</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserDashboard;
