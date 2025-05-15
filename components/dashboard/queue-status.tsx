"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, Timer } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';

interface QueueStatus {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  total: number;
  error?: string;
}

interface UserDocuments {
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    total: number;
}

export function QueueStatus() {
  const [queueStatus, setQueueStatus] = useState<QueueStatus>({
    waiting: 0,
    active: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  const [userDocuments, setUserDocuments] = useState<UserDocuments>({
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [redisConnected, setRedisConnected] = useState(false);

  const fetchQueueStatus = async () => {
    try {
      setError(null);
  
      // Get the session token
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Failed to get session');
      }
      
      if (!session) {
        console.error('No session found');
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/queue-status', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
        
        if (!response.ok) {
        const errorData = await response.json();
        console.error('Queue status response error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(errorData.error || `Failed to fetch queue status: ${response.statusText}`);
        }
        
        const data = await response.json();
      setQueueStatus(data.queueStatus);
      setUserDocuments(data.userDocuments);
      setRedisConnected(data.redisConnected);
      setIsLoading(false);
      } catch (err) {
      console.error('Error fetching queue status:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch queue status');
        setIsLoading(false);
      }
    };
    
  useEffect(() => {
    fetchQueueStatus();
    const interval = setInterval(fetchQueueStatus, 5000);
    return () => clearInterval(interval);
  }, []);
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Queue Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-destructive">
            <AlertCircle className="h-5 w-5" />
            <p className="text-sm">{error}</p>
      </div>
        </CardContent>
      </Card>
    );
  }
  
  const total = queueStatus.total || 0;
  const progress = total > 0 ? ((queueStatus.completed + queueStatus.failed) / total) * 100 : 0;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Queue Status</CardTitle>
      </CardHeader>
      <CardContent>
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Processing Progress</span>
              <span>{progress.toFixed(0)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Queue Status</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Waiting
                  </span>
                  <span>{queueStatus.waiting}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-blue-500" />
                    Active
                  </span>
                  <span>{queueStatus.active}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Completed
                  </span>
                  <span>{queueStatus.completed}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Failed
                  </span>
                  <span>{queueStatus.failed}</span>
                </div>
        </div>
      </div>
      
            <div className="space-y-2">
              <p className="text-sm font-medium">Your Documents</p>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4 text-amber-500" />
                    Pending
                  </span>
                  <span>{userDocuments.pending}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <Timer className="h-4 w-4 text-blue-500" />
                    Processing
                  </span>
                  <span>{userDocuments.processing}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    Completed
                  </span>
                  <span>{userDocuments.completed}</span>
        </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center gap-1">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Failed
                  </span>
                  <span>{userDocuments.failed}</span>
        </div>
        </div>
        </div>
      </div>
      
          {!redisConnected && (
            <div className="mt-4 p-2 bg-amber-500/10 rounded-md">
              <p className="text-sm text-amber-500 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                Redis connection is not available. Queue status may be inaccurate.
              </p>
        </div>
      )}
    </div>
      </CardContent>
    </Card>
  );
}