import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';

interface ResearchPaperPDFUploadProps {
  onFileUpload: (file: File) => Promise<string>;
  onUploadComplete: (fileUrl: string, fileName: string) => void;
  disabled?: boolean;
}

const ResearchPaperPDFUpload: React.FC<ResearchPaperPDFUploadProps> = ({
  onFileUpload,
  onUploadComplete,
  disabled = false
}) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please upload a PDF file only.');
      return;
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (file.size > maxSize) {
      setError('File size must be less than 10MB.');
      return;
    }

    setError('');
    setUploadedFile(file);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const fileUrl = await onFileUpload(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setSuccess(true);
      
      setTimeout(() => {
        onUploadComplete(fileUrl, file.name);
      }, 1000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  }, [onFileUpload, onUploadComplete]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles: 1,
    disabled: isUploading || success || disabled
  });

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const removeFile = () => {
    setUploadedFile(null);
    setUploadProgress(0);
    setError('');
    setSuccess(false);
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card className={`border-2 border-dashed transition-all duration-300 ${
        disabled ? 'border-gray-200 bg-gray-50' : 'border-gray-300 hover:border-gray-400'
      }`}>
        <CardContent className="p-6">
          {!uploadedFile ? (
            <div
              {...getRootProps()}
              className={`text-center transition-all duration-300 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              } ${isDragActive && !disabled ? 'bg-gray-50' : ''}`}
            >
              <input {...getInputProps()} />
              <div className="space-y-3">
                <div className="mx-auto w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                  <Upload className="h-6 w-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-base font-medium text-black">
                    {isDragActive && !disabled ? 'Drop your PDF here' : 'Drag & drop your PDF here'}
                  </p>
                  <p className="text-gray-500 mt-1 text-sm">
                    or <span className="text-black font-medium">click to browse</span>
                  </p>
                </div>
                <div className="text-xs text-gray-400">
                  Supports: PDF files up to 10MB
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* File Info */}
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-6 w-6 text-red-600" />
                  <div>
                    <p className="font-medium text-black text-sm">{uploadedFile.name}</p>
                    <p className="text-xs text-gray-500">{formatFileSize(uploadedFile.size)}</p>
                  </div>
                </div>
                {!isUploading && !success && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-gray-500 hover:text-red-600 h-8 w-8 p-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Upload Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Uploading...</span>
                    <span className="text-gray-600">{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-2" />
                </div>
              )}

              {/* Success State */}
              {success && (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    PDF uploaded successfully!
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Error Message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default ResearchPaperPDFUpload;
