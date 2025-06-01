import React, { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, X, Check, AlertCircle } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import axios from 'axios';

interface FileUploaderProps {
  endpoint: string;
  onUploadComplete: (fileUrl: string) => void;
  acceptedFileTypes?: string;
  maxSizeMB?: number;
  label?: string;
  initialFileUrl?: string;
}

const FileUploader: React.FC<FileUploaderProps> = ({
  endpoint,
  onUploadComplete,
  acceptedFileTypes = "image/*",
  maxSizeMB = 5,
  label = "Upload File",
  initialFileUrl
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(initialFileUrl || null);
  const [uploading, setUploading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setUploadSuccess(false);
    
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    // Validate file size
    if (selectedFile.size > maxSizeBytes) {
      setError(`File size exceeds the maximum limit of ${maxSizeMB}MB`);
      return;
    }
    
    // Validate file type
    const fileType = selectedFile.type;
    const acceptedTypes = acceptedFileTypes.split(',').map(type => type.trim());
    
    if (acceptedTypes[0] !== "*" && !acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        const mainType = type.split('/')[0];
        return fileType.startsWith(`${mainType}/`);
      }
      return type === fileType;
    })) {
      setError(`Invalid file type. Accepted types: ${acceptedFileTypes}`);
      return;
    }
    
    setFile(selectedFile);
    
    // Create preview for images
    if (fileType.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    
    setUploading(true);
    setError(null);
    
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.post(endpoint, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`
        }
      });
      
      setUploadSuccess(true);
      onUploadComplete(response.data.fileUrl);
      
      toast({
        title: "Upload Successful",
        description: "File has been uploaded successfully",
      });
    } catch (err) {
      console.error('Upload error:', err);
      setError('Failed to upload file. Please try again.');
      
      toast({
        title: "Upload Failed",
        description: "There was an error uploading your file",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
    setError(null);
    setUploadSuccess(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 transition-colors hover:border-gray-400">
        {preview ? (
          <div className="space-y-4">
            <div className="relative w-full h-48 bg-gray-100 rounded-md overflow-hidden">
              <img 
                src={preview} 
                alt="File preview" 
                className="w-full h-full object-contain"
              />
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-1 bg-gray-800 bg-opacity-70 rounded-full text-white hover:bg-opacity-100 transition-opacity"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-500 truncate max-w-[200px]">
                {file?.name || "Current file"}
              </div>
              
              <div className="flex space-x-2">
                {!uploadSuccess && (
                  <Button
                    size="sm"
                    onClick={handleUpload}
                    disabled={uploading}
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="mr-2 h-4 w-4" />
                        Upload
                      </>
                    )}
                  </Button>
                )}
                
                {uploadSuccess && (
                  <div className="flex items-center text-green-600">
                    <Check className="mr-1 h-4 w-4" />
                    <span className="text-sm">Uploaded</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div 
            className="flex flex-col items-center justify-center py-6 cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-10 w-10 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-1">
              Drag and drop or click to upload
            </p>
            <p className="text-xs text-gray-400">
              {acceptedFileTypes === "image/*" 
                ? "Supports JPG, PNG, GIF" 
                : `Accepted formats: ${acceptedFileTypes}`}
            </p>
            <p className="text-xs text-gray-400">
              Max size: {maxSizeMB}MB
            </p>
          </div>
        )}
        
        <Input
          ref={fileInputRef}
          type="file"
          accept={acceptedFileTypes}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
      
      {error && (
        <div className="flex items-center text-red-500 text-sm">
          <AlertCircle className="h-4 w-4 mr-1" />
          {error}
        </div>
      )}
    </div>
  );
};

export default FileUploader;
