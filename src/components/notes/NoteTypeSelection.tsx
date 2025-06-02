import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Upload, ArrowRight } from 'lucide-react';

interface NoteTypeSelectionProps {
  onSelectType: (type: 'text' | 'pdf') => void;
}

const NoteTypeSelection: React.FC<NoteTypeSelectionProps> = ({ onSelectType }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-black modern-heading">Create New Note</h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose how you'd like to create your note. You can either write directly in our editor or upload a PDF document.
        </p>
      </div>

      {/* Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Text Editor Option */}
        <Card className="border-2 border-gray-200 hover:border-gray-900 transition-all duration-300 cursor-pointer group hover:shadow-xl">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                <FileText className="h-8 w-8 text-gray-800" />
              </div>
              <div>
                <CardTitle className="text-xl text-black modern-heading">Write Notes</CardTitle>
                <CardDescription className="text-gray-600">
                  Use our advanced text editor
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-black">Features included:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Rich text formatting with slash commands
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Drag-and-drop line reordering
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Cover image upload capability
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Spell checker and grammar checker
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Real-time auto-save
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={() => onSelectType('text')}
              className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-medium transition-all duration-300 group-hover:shadow-lg"
            >
              Start Writing
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* PDF Upload Option */}
        <Card className="border-2 border-gray-200 hover:border-gray-900 transition-all duration-300 cursor-pointer group hover:shadow-xl">
          <CardHeader className="pb-6 bg-gradient-to-r from-gray-50 to-gray-100 group-hover:from-gray-100 group-hover:to-gray-200 transition-all duration-300">
            <div className="flex items-center gap-4">
              <div className="p-4 rounded-xl bg-white shadow-md border border-gray-300 group-hover:shadow-lg transition-all duration-300">
                <Upload className="h-8 w-8 text-gray-800" />
              </div>
              <div>
                <CardTitle className="text-xl text-black modern-heading">Upload PDF</CardTitle>
                <CardDescription className="text-gray-600">
                  Upload an existing PDF document
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-black">Features included:</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Drag-and-drop file upload
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Built-in PDF viewer with navigation
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Zoom and search functionality
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  Secure file storage
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                  File size up to 10MB
                </li>
              </ul>
            </div>
            
            <Button 
              onClick={() => onSelectType('pdf')}
              className="w-full h-12 bg-black text-white hover:bg-gray-800 rounded-xl font-medium transition-all duration-300 group-hover:shadow-lg"
            >
              Upload PDF
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Additional Info */}
      <div className="text-center">
        <p className="text-sm text-gray-500">
          Both options support categorization, privacy settings, and can be saved to personal libraries.
        </p>
      </div>
    </div>
  );
};

export default NoteTypeSelection;
