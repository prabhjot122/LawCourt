import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Play, Clock, Users, Star, CheckCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

const CourseDetail = () => {
  const { id } = useParams();

  // Dummy course data
  const course = {
    id: 1,
    title: 'Introduction to Constitutional Law',
    description: 'Learn the fundamentals of constitutional law and its applications in modern legal practice.',
    instructor: 'Dr. Sarah Johnson',
    duration: '8 weeks',
    students: 245,
    rating: 4.8,
    level: 'Beginner',
    price: 'Free',
    thumbnail: '/api/placeholder/800/400',
    isEnrolled: true,
    progress: 65,
    modules: [
      {
        id: 1,
        title: 'Introduction to Constitutional Principles',
        lessons: 5,
        duration: '2 hours',
        completed: true,
      },
      {
        id: 2,
        title: 'Separation of Powers',
        lessons: 4,
        duration: '1.5 hours',
        completed: true,
      },
      {
        id: 3,
        title: 'Bill of Rights',
        lessons: 6,
        duration: '2.5 hours',
        completed: false,
        current: true,
      },
      {
        id: 4,
        title: 'Modern Constitutional Issues',
        lessons: 5,
        duration: '2 hours',
        completed: false,
      },
    ],
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Back Button */}
          <Button variant="ghost" asChild className="hover:bg-gray-100">
            <Link to="/courses" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Courses
            </Link>
          </Button>

          {/* Course Header */}
          <Card className="border-gray-200 shadow-lg">
            <div className="aspect-video bg-gray-200 rounded-t-lg overflow-hidden">
              <img src={course.thumbnail} alt={course.title} className="w-full h-full object-cover" />
            </div>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300">{course.level}</Badge>
                    <span className="text-2xl font-bold text-black">{course.price}</span>
                  </div>
                  <h1 className="text-3xl font-bold mb-4 text-black">{course.title}</h1>
                  <p className="text-gray-600 mb-6">{course.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                    <span className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {course.duration}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {course.students} students
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      {course.rating}
                    </span>
                  </div>

                  <p className="text-gray-600">Instructor: <strong className="text-black">{course.instructor}</strong></p>
                </div>

                <div className="space-y-4">
                  {course.isEnrolled && (
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Course Progress</span>
                        <span className="text-black font-medium">{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="mb-4" />
                    </div>
                  )}

                  <Button className="w-full bg-black hover:bg-gray-800 text-white" size="lg">
                    {course.isEnrolled ? (
                      <>
                        <Play className="h-5 w-5 mr-2" />
                        Continue Learning
                      </>
                    ) : (
                      'Enroll Now'
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Course Modules */}
          <Card className="border-gray-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-black">Course Content</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {course.modules.map((module, index) => (
                  <div
                    key={module.id}
                    className={`border rounded-lg p-4 ${
                      module.current ? 'border-gray-400 bg-gray-50' : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          module.completed
                            ? 'bg-green-100 text-green-600 border border-green-300'
                            : module.current
                            ? 'bg-black text-white'
                            : 'bg-gray-100 text-gray-600 border border-gray-300'
                        }`}>
                          {module.completed ? (
                            <CheckCircle className="h-5 w-5" />
                          ) : (
                            <span>{index + 1}</span>
                          )}
                        </div>
                        <div>
                          <h3 className="font-medium text-black">{module.title}</h3>
                          <p className="text-sm text-gray-600">
                            {module.lessons} lessons • {module.duration}
                          </p>
                        </div>
                      </div>

                      {course.isEnrolled && (module.completed || module.current) && (
                        <Button
                          size="sm"
                          variant={module.current ? "default" : "outline"}
                          className={module.current ? "bg-black hover:bg-gray-800 text-white" : "border-gray-300 text-gray-700 hover:bg-gray-100"}
                        >
                          {module.completed ? 'Review' : 'Start'}
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;
