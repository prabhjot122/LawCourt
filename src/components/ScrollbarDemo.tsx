import React from 'react';
import CustomScrollbar from '@/components/ui/custom-scrollbar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * ScrollbarDemo component showcases the different scrollbar variants
 * available in the LawFort project's black and white theme.
 */
const ScrollbarDemo: React.FC = () => {
  const sampleContent = Array.from({ length: 50 }, (_, i) => (
    <div key={i} className="p-3 border-b border-gray-200 last:border-b-0">
      <h4 className="font-semibold text-gray-900">Legal Document {i + 1}</h4>
      <p className="text-gray-600 text-sm mt-1">
        This is a sample legal document entry that demonstrates the scrollbar styling.
        The content is long enough to trigger scrolling behavior in the container.
      </p>
    </div>
  ));

  return (
    <div className="p-8 space-y-8 bg-gray-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          LawFort Scrollbar Variants
        </h1>
        <p className="text-gray-600 mb-8">
          Aesthetic scrollbars that match our black and white professional theme.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Default Scrollbar */}
          <Card>
            <CardHeader>
              <CardTitle>Default Scrollbar</CardTitle>
              <CardDescription>
                Standard 8px scrollbar with gradient styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomScrollbar variant="default" maxHeight="300px">
                <div className="space-y-2">
                  {sampleContent.slice(0, 20)}
                </div>
              </CustomScrollbar>
            </CardContent>
          </Card>

          {/* Thin Scrollbar */}
          <Card>
            <CardHeader>
              <CardTitle>Thin Scrollbar</CardTitle>
              <CardDescription>
                Compact 6px scrollbar for tight spaces
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomScrollbar variant="thin" maxHeight="300px">
                <div className="space-y-2">
                  {sampleContent.slice(0, 20)}
                </div>
              </CustomScrollbar>
            </CardContent>
          </Card>

          {/* Wide Scrollbar */}
          <Card>
            <CardHeader>
              <CardTitle>Wide Scrollbar</CardTitle>
              <CardDescription>
                Prominent 12px scrollbar for main content areas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomScrollbar variant="wide" maxHeight="300px">
                <div className="space-y-2">
                  {sampleContent.slice(0, 20)}
                </div>
              </CustomScrollbar>
            </CardContent>
          </Card>

          {/* Hover Scrollbar */}
          <Card>
            <CardHeader>
              <CardTitle>Hover Scrollbar</CardTitle>
              <CardDescription>
                Invisible scrollbar that appears on hover
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomScrollbar variant="hover" maxHeight="300px">
                <div className="space-y-2">
                  {sampleContent.slice(0, 20)}
                </div>
              </CustomScrollbar>
            </CardContent>
          </Card>

          {/* Legal Scrollbar */}
          <Card>
            <CardHeader>
              <CardTitle>Legal Scrollbar</CardTitle>
              <CardDescription>
                Professional legal document style with enhanced borders
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomScrollbar variant="legal" maxHeight="300px">
                <div className="space-y-2">
                  {sampleContent.slice(0, 20)}
                </div>
              </CustomScrollbar>
            </CardContent>
          </Card>

          {/* Full Page Example */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle>Full Page Scrolling</CardTitle>
              <CardDescription>
                The main page uses the default scrollbar styling
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-gray-600 space-y-2">
                <p>• Smooth scrolling behavior enabled</p>
                <p>• Responsive design across all devices</p>
                <p>• Dark mode support included</p>
                <p>• Professional legal aesthetic</p>
                <p>• Hover effects and transitions</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Usage Examples */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Usage Examples</CardTitle>
            <CardDescription>
              How to apply different scrollbar variants in your components
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Using the CustomScrollbar component:</h4>
                <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
{`<CustomScrollbar variant="legal" maxHeight="400px">
  {/* Your content here */}
</CustomScrollbar>`}
                </pre>
              </div>
              
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">Using CSS classes directly:</h4>
                <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
{`<div className="overflow-auto scrollbar-thin max-h-96">
  {/* Your content here */}
</div>`}
                </pre>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ScrollbarDemo;
