import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import EnhancedImage from '@/components/ui/enhanced-image';
import { Star, Users, Clock } from 'lucide-react';

const ImageShowcase: React.FC = () => {
  const showcaseItems = [
    {
      type: 'blog' as const,
      title: 'Constitutional Law Blog Post',
      description: 'High-quality legal imagery with hover effects',
      imagePath: '/images/blog/constitutional-digital.jpg',
      badges: ['Constitutional Law', 'Featured'],
      overlay: <Badge className="bg-yellow-500 text-yellow-900">Featured</Badge>
    },
    {
      type: 'course' as const,
      title: 'Corporate Law Course',
      description: 'Professional course imagery with enrollment info',
      imagePath: '/images/courses/corporate-law.jpg',
      badges: ['12 weeks', '22/25 enrolled'],
      overlay: (
        <div className="flex items-center gap-2 bg-white/90 rounded-full px-3 py-1">
          <Users className="h-4 w-4" />
          <span className="text-sm font-medium">22/25</span>
        </div>
      )
    },
    {
      type: 'job' as const,
      title: 'Legal Job Posting',
      description: 'Professional job imagery with company branding',
      imagePath: '/images/jobs/corporate-law-associate.jpg',
      badges: ['Full-time', '$180k-220k'],
      overlay: <Badge variant="secondary">Apply Now</Badge>
    },
    {
      type: 'research' as const,
      title: 'AI Legal Research Paper',
      description: 'Academic imagery for research publications',
      imagePath: '/images/research/ai-legal-decisions.jpg',
      badges: ['Research', 'AI & Law'],
      overlay: <Badge variant="outline">15 Citations</Badge>
    }
  ];

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Enhanced Image System
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Our enhanced image system provides high-quality, optimized legal-themed images 
          with smart fallbacks, hover effects, and responsive design for all content types.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {showcaseItems.map((item, index) => (
          <Card key={index} className="hover:shadow-lg transition-all duration-300">
            <EnhancedImage
              src={item.imagePath}
              alt={item.title}
              contentType={item.type}
              aspectRatio="video"
              showOverlay={true}
              overlayContent={item.overlay}
              className="rounded-t-lg"
            />
            <CardHeader>
              <div className="flex items-center justify-between mb-2">
                <Badge variant="secondary" className="capitalize">
                  {item.type}
                </Badge>
                <div className="flex gap-1">
                  {item.badges.slice(0, 2).map((badge, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </div>

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500" />
            Image Enhancement Features
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Smart Fallbacks</h4>
              <p className="text-sm text-gray-600">
                Automatic fallback to high-quality legal-themed images when original images fail to load
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Optimized Loading</h4>
              <p className="text-sm text-gray-600">
                Lazy loading, proper sizing, and optimized URLs for better performance
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Hover Effects</h4>
              <p className="text-sm text-gray-600">
                Smooth transitions, scale effects, and overlay content for better user experience
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Content-Aware</h4>
              <p className="text-sm text-gray-600">
                Different image themes for blogs, courses, jobs, and research content
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Responsive Design</h4>
              <p className="text-sm text-gray-600">
                Proper aspect ratios and sizing for all screen sizes and devices
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-900">Loading States</h4>
              <p className="text-sm text-gray-600">
                Skeleton loading animations and error states for better UX
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ImageShowcase;
