"use client"

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface DocumentUploadProps {
  onUploadComplete?: () => void;
}

export function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setSelectedFile(acceptedFiles[0]);
      setError(null);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive, open } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: isUploading,
    onDropRejected: (fileRejections) => {
      const rejection = fileRejections[0];
      if (rejection.errors[0].code === 'file-too-large') {
        setError('File is too large. Maximum size is 10MB.');
      } else if (rejection.errors[0].code === 'file-invalid-type') {
        setError('Invalid file type. Please upload a PDF, TXT, or DOCX file.');
      } else {
        setError('Error uploading file. Please try again.');
      }
    },
  });
  
  const handleUpload = async () => {
    if (!selectedFile) return;
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setError(null);
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('Not authenticated');
      }

      // Generate a unique ID for the document
      const documentId = crypto.randomUUID();
      const filePath = `${session.user.id}/${documentId}-${selectedFile.name}`;

      // Create document record in the database first with 'pending' status
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          id: documentId,
          user_id: session.user.id,
          name: selectedFile.name,
          file_path: filePath,
          status: 'pending',
          file_size: selectedFile.size,
          mime_type: selectedFile.type
        });

      if (dbError) {
        console.error('Error creating document record:', dbError);
        throw new Error(`Failed to create document record: ${dbError.message}`);
      }

      // Upload file to Supabase Storage with progress tracking
      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          onUploadProgress: (progress) => {
            const percent = (progress.loaded / progress.total) * 100;
            setUploadProgress(Math.round(percent));
          }
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        // Update document status to failed
        await supabase
          .from('documents')
          .update({
            status: 'failed',
            error_message: `Upload failed: ${uploadError.message}`,
            updated_at: new Date().toISOString()
          })
          .eq('id', documentId);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      // Update document status to queued for processing
      const { error: updateError } = await supabase
        .from('documents')
        .update({
          status: 'queued',
          updated_at: new Date().toISOString()
        })
        .eq('id', documentId);

      if (updateError) {
        console.error('Error updating document status:', updateError);
        throw new Error(`Failed to update document status: ${updateError.message}`);
      }

      // Trigger document processing
      console.log('Triggering document processing...');
      const response = await fetch('/api/process-document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          documentId,
          filePath,
          mimeType: selectedFile.type
        })
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Error triggering document processing:', error);
        throw new Error(`Failed to start document processing: ${error.error || 'Unknown error'}`);
      }

      // Get document name for the prompt
      const documentName = selectedFile.name.replace(/\.[^/.]+$/, ""); // Remove file extension

      toast.success(
        <div className="space-y-2">
          <p>Document uploaded successfully!</p>
          <p className="text-sm text-muted-foreground">
            Try asking questions like:
            <ul className="list-disc list-inside mt-1">
              <li>What are the main points in {documentName}?</li>
              <li>Can you summarize {documentName}?</li>
              <li>What are the key findings in {documentName}?</li>
            </ul>
          </p>
          <Button 
            onClick={() => {
              router.push(`/chat?document=${documentId}`);
            }}
            className="mt-2"
          >
            Start Chat
          </Button>
        </div>
      );

      setSelectedFile(null);
      setUploadProgress(100);
      
      if (onUploadComplete) {
        onUploadComplete();
      }
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
      toast.error(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  };
  
  const removeFile = () => {
    setSelectedFile(null);
    setUploadProgress(0);
    setError(null);
  };
  
  if (selectedFile) {
    return (
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary/10 rounded-md">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium truncate max-w-[180px]">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>
          
          {!isUploading && (
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={removeFile}
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        
        {isUploading ? (
          <div className="space-y-2">
            <div className="text-xs flex justify-between">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-1" />
          </div>
        ) : (
          <Button 
            onClick={handleUpload} 
            className="w-full"
            disabled={isUploading}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Document
          </Button>
        )}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
          ${isUploading ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center gap-2">
          <Upload className="h-8 w-8 text-muted-foreground" />
          {isDragActive ? (
            <p className="text-sm text-muted-foreground">Drop the file here</p>
          ) : (
            <div className="text-sm text-muted-foreground">
              <p>Drag and drop a file here, or click to select</p>
              <p className="text-xs mt-1">Supported formats: PDF, TXT, DOCX (max 10MB)</p>
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <div className="text-sm text-red-500">
          {error}
        </div>
      )}

      {selectedFile && (
        <div className="flex items-center gap-2 p-2 bg-muted rounded-lg">
          <FileText className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm flex-1 truncate">{selectedFile.name}</span>
          <Button
            variant="ghost"
            size="icon"
            onClick={removeFile}
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {isUploading && (
        <div className="space-y-2">
          <Progress value={uploadProgress} />
          <p className="text-xs text-muted-foreground text-center">
            Uploading... {uploadProgress}%
          </p>
        </div>
      )}

      <Button variant="outline" onClick={open} className="w-full">
        Browse Files
      </Button>
    </div>
  );
}