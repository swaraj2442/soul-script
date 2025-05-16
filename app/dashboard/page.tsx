"use client"

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DocumentUpload } from '@/components/documents/document-upload';
import { DocumentList } from '@/components/documents/document-list';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { QueueStatus } from '@/components/dashboard/queue-status';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MessageSquare, FileText, Upload, History } from 'lucide-react';

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState('documents');
  const [reloadTrigger, setReloadTrigger] = useState(0);

  useEffect(() => {
    const checkAuth = async () => {
      const { data, error } = await supabase.auth.getSession();
      
      if (error || !data.session) {
        router.push('/auth/login');
        return;
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
    };
    
    checkAuth();
  }, [router]);

  const handleDocumentUploaded = () => {
    toast.success('Document uploaded successfully');
    setReloadTrigger(prev => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect via the useEffect
  }

  return (
    <div className="container max-w-[1400px] py-8 md:py-12 mx-auto px-4">
      <div className="max-w-[1200px] mx-auto space-y-12">
        <div className="text-center">
      <DashboardHeader />
        </div>
      
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Upload className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Upload Document</CardTitle>
              </div>
              <CardDescription className="text-center mt-2">
              Upload new documents to process and analyze
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentUpload onUploadComplete={handleDocumentUploaded} />
          </CardContent>
        </Card>
        
          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <History className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Processing Queue</CardTitle>
              </div>
              <CardDescription className="text-center mt-2">
              Check the status of document processing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <QueueStatus reloadTrigger={reloadTrigger} />
          </CardContent>
        </Card>
        
          <Card className="border-2 hover:border-primary/50 transition-colors hover:shadow-lg">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <MessageSquare className="h-5 w-5 text-primary" />
                </div>
                <CardTitle className="text-xl">Quick Actions</CardTitle>
              </div>
              <CardDescription className="text-center mt-2">
              Common actions you may want to take
            </CardDescription>
          </CardHeader>
            <CardContent className="space-y-4">
            <Button 
              onClick={() => router.push('/chat')}
                className="w-full justify-center gap-2 h-11 text-base hover:bg-primary/90"
              variant="outline"
            >
                <MessageSquare className="h-5 w-5" />
              Start New Chat
            </Button>
            <Button 
              onClick={() => setActiveTab('documents')} 
                className="w-full justify-center gap-2 h-11 text-base hover:bg-primary/90"
              variant="outline"
            >
                <FileText className="h-5 w-5" />
              View All Documents
            </Button>
          </CardContent>
        </Card>
      </div>
      
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
          className="space-y-8"
        >
          <div className="flex justify-center">
            <TabsList className="grid w-full md:w-[500px] grid-cols-2 h-12">
              <TabsTrigger value="documents" className="flex items-center justify-center gap-2 text-base">
                <FileText className="h-5 w-5" />
                Documents
              </TabsTrigger>
              <TabsTrigger value="conversations" className="flex items-center justify-center gap-2 text-base">
                <MessageSquare className="h-5 w-5" />
                Conversations
              </TabsTrigger>
        </TabsList>
          </div>
        
          <TabsContent value="documents">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Your Documents</CardTitle>
                </div>
                <CardDescription className="text-center mt-2">
                Manage documents you've uploaded
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentList reloadTrigger={reloadTrigger} />
            </CardContent>
          </Card>
        </TabsContent>
        
          <TabsContent value="conversations">
            <Card className="border-2 hover:shadow-lg transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="text-xl">Your Conversations</CardTitle>
                </div>
                <CardDescription className="text-center mt-2">
                View your previous conversations
              </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-20">
                  <div className="p-4 bg-primary/5 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-6">
                    <MessageSquare className="h-8 w-8 text-muted-foreground/50" />
                  </div>
                  <p className="text-muted-foreground text-lg mb-8">
                  Your conversation history will appear here
                </p>
                <Button 
                  onClick={() => router.push('/chat')}
                    className="gap-2 h-11 text-base"
                    size="lg"
                >
                    <MessageSquare className="h-5 w-5" />
                  Start a New Chat
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </div>
  );
}