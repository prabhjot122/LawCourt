import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { GraduationCap, Clock, Users, Star, Save, Edit, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { contentApi, userApi, Course } from '@/services/api';
import { getOptimizedImageUrl, handleImageError } from '@/utils/imageUtils';
import { useToast } from '@/hooks/use-toast';
import LoadingSpinner from '@/components/ui/loading-spinner';
import { useAuth, Permission, UserRole } from '@/contexts/AuthContext';

const Courses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { user, hasPermission } = useAuth();

  const canSaveContent = hasPermission(Permission.CONTENT_SAVE);

  // Fetch courses from API
  const fetchCourses = async () => {
      try {
        setLoading(true);
        const response = await contentApi.getCourses();
        setCourses(response.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast({
          title: "Error",
          description: "Failed to load courses. Using dummy data.",
          variant: "destructive",
        });

        // Fallback to dummy data with real educational images
        setCourses([
          {
            course_id: 1,
            content_id: 1,
            user_id: 1,
            title: 'Introduction to Constitutional Law',
            summary: 'Learn the fundamentals of constitutional law and its applications.',
            content: 'Comprehensive course content...',
            featured_image: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=800&h=400&fit=crop&crop=center',
            tags: 'constitutional,law,beginner',
            created_at: '2024-01-15T00:00:00Z',
            updated_at: '2024-01-15T00:00:00Z',
            status: 'published',
            is_featured: true,
            instructor: 'Dr. Sarah Johnson',
            duration: '8 weeks',
            start_date: '2024-02-01T00:00:00Z',
            end_date: '2024-03-29T00:00:00Z',
            enrollment_limit: 300,
            current_enrollment: 245,
            prerequisites: 'None',
            syllabus: 'Week 1: Introduction...',
            author_name: 'Dr. Sarah Johnson',
          },
          {
            course_id: 2,
            content_id: 2,
            user_id: 2,
            title: 'Advanced Corporate Law',
            summary: 'Deep dive into corporate governance and business law.',
            content: 'Advanced course content...',
            featured_image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=400&fit=crop&crop=center',
            tags: 'corporate,law,advanced',
            created_at: '2024-01-10T00:00:00Z',
            updated_at: '2024-01-10T00:00:00Z',
            status: 'published',
            is_featured: false,
            instructor: 'Prof. Michael Chen',
            duration: '12 weeks',
            start_date: '2024-02-15T00:00:00Z',
            end_date: '2024-05-10T00:00:00Z',
            enrollment_limit: 200,
            current_enrollment: 189,
            prerequisites: 'Basic Law Knowledge',
            syllabus: 'Week 1: Corporate Structure...',
            author_name: 'Prof. Michael Chen',
          },
        ]);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchCourses();
  }, [toast]);

  const handleSaveCourse = async (course: Course) => {
    try {
      await userApi.saveContent({ content_id: course.content_id, notes: `Saved course: ${course.title}` });
      toast({
        title: "Success",
        description: "Course saved to your personal library successfully!",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save course. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCourse = async (courseId: number) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      await contentApi.deleteCourse(courseId);
      toast({
        title: "Success",
        description: "Course deleted successfully.",
      });
      // Refresh courses to remove deleted course
      fetchCourses();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete course. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-black">Courses</h1>
            <p className="text-gray-600 mt-2">Enhance your legal knowledge with expert-led courses</p>
          </div>

          {/* Featured Courses */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">Featured Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.filter(course => course.is_featured).map((course) => (
                <Card key={course.course_id} className="border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg overflow-hidden relative group">
                    <img
                      src={getOptimizedImageUrl(course.featured_image, 800, 400, 'course')}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => handleImageError(e, 'course')}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-black text-white border-gray-300">
                        <Star className="h-3 w-3 mr-1" />
                        Featured
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 border-gray-300">
                        {course.duration}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader>
                    <CardTitle className="text-lg text-black">{course.title}</CardTitle>
                    <CardDescription>{course.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.current_enrollment}/{course.enrollment_limit}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 bg-black hover:bg-gray-800 text-white">
                          <Link to={`/courses/${course.course_id}`}>View Course</Link>
                        </Button>

                        <div className="flex items-center gap-2">
                          {canSaveContent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveCourse(course)}
                              className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                          )}

                          {/* Show edit button for admin (all courses) or editor (own courses only) */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && course.user_id === parseInt(user.id))) && (
                            <Button variant="outline" size="sm" asChild className="border-gray-300 text-gray-700 hover:bg-gray-100">
                              <Link to={`/courses/${course.course_id}/edit`}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          )}

                          {/* Show delete button for admin (all courses) or editor (own courses only) */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && course.user_id === parseInt(user.id))) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.course_id)}
                              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Available Courses */}
          <div>
            <h2 className="text-xl font-semibold mb-4 text-black">Available Courses</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <Card key={course.course_id} className="border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className="aspect-video bg-gradient-to-br from-gray-50 to-gray-100 rounded-t-lg overflow-hidden relative group">
                    <img
                      src={getOptimizedImageUrl(course.featured_image, 800, 400, 'course')}
                      alt={course.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => handleImageError(e, 'course')}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all duration-300" />
                    {course.is_featured && (
                      <div className="absolute top-3 right-3">
                        <Badge className="bg-black text-white border-gray-300">
                          <Star className="h-3 w-3 mr-1" />
                          Featured
                        </Badge>
                      </div>
                    )}
                    <div className="absolute bottom-3 left-3">
                      <Badge variant="secondary" className="bg-white/90 text-gray-800 border-gray-300">
                        {course.duration}
                      </Badge>
                    </div>
                    <div className="absolute bottom-3 right-3">
                      <div className="flex items-center gap-1 bg-white/90 rounded-full px-2 py-1 border border-gray-300">
                        <Users className="h-3 w-3 text-gray-600" />
                        <span className="text-xs text-gray-600">
                          {course.current_enrollment}/{course.enrollment_limit}
                        </span>
                      </div>
                    </div>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant={course.status === 'published' ? 'secondary' : 'default'} className="bg-gray-100 text-gray-800 border-gray-300">
                        {course.status}
                      </Badge>
                      <Badge variant="outline" className="border-gray-300 text-gray-700">
                        {course.is_featured ? 'Featured' : 'Regular'}
                      </Badge>
                    </div>
                    <CardTitle className="text-lg text-black">{course.title}</CardTitle>
                    <CardDescription>{course.summary}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {course.duration}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {course.current_enrollment}/{course.enrollment_limit}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Instructor: {course.instructor}</p>
                      <p className="text-xs text-gray-500">
                        Starts: {new Date(course.start_date).toLocaleDateString()}
                      </p>
                      <div className="flex gap-2">
                        <Button asChild className="flex-1 bg-black hover:bg-gray-800 text-white">
                          <Link to={`/courses/${course.course_id}`}>
                            Enroll Now
                          </Link>
                        </Button>

                        <div className="flex items-center gap-2">
                          {canSaveContent && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleSaveCourse(course)}
                              className="flex items-center gap-1 border-gray-300 text-gray-700 hover:bg-gray-100"
                            >
                              <Save className="h-3 w-3" />
                              Save
                            </Button>
                          )}

                          {/* Show edit button for admin (all courses) or editor (own courses only) */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && course.user_id === parseInt(user.id))) && (
                            <Button variant="outline" size="sm" asChild className="border-gray-300 text-gray-700 hover:bg-gray-100">
                              <Link to={`/courses/${course.course_id}/edit`}>
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Link>
                            </Button>
                          )}

                          {/* Show delete button for admin (all courses) or editor (own courses only) */}
                          {((user?.role === UserRole.ADMIN) ||
                            (user?.role === UserRole.EDITOR && course.user_id === parseInt(user.id))) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteCourse(course.course_id)}
                              className="text-red-600 hover:text-red-700 border-red-300 hover:bg-red-50"
                            >
                              <Trash2 className="h-3 w-3 mr-1" />
                              Delete
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {courses.length === 0 && !loading && (
            <div className="text-center py-12">
              <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-black mb-2">No courses available</h3>
              <p className="text-gray-500">Check back later for new courses.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Courses;
