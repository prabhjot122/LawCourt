import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Download,
  FileText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PDFViewerProps {
  fileUrl: string;
  fileName: string;
}

const PDFViewer: React.FC<PDFViewerProps> = ({ fileUrl, fileName }) => {
  const { toast } = useToast();

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Download Started",
      description: `Downloading ${fileName}`,
    });
  };



  return (
    <div className="space-y-4">
      {/* PDF Download Card */}
      <Card className="border-2 border-gray-200 shadow-lg">
        <CardHeader className="pb-4 bg-gradient-to-r from-gray-50 to-gray-100">
          <CardTitle className="text-lg text-black modern-heading flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              PDF Document - {fileName}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="text-center max-w-md">
              <div className="bg-red-50 rounded-full p-6 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-red-600" />
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                PDF Document Available
              </h3>

              <p className="text-gray-600 mb-6">
                PDF Document • Click below to download the PDF file
              </p>

              <div className="space-y-3">
                <Button
                  onClick={handleDownload}
                  className="w-full bg-black text-white hover:bg-gray-800 py-3 text-base font-medium"
                  size="lg"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Download PDF
                </Button>
              </div>

              <p className="text-sm text-gray-500 mt-4">
                File: {fileName}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFViewer;
