"use client"

import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  ChevronDown, 
  FileText,
  UserCircle, 
  LogOut 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { supabase } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  
  useEffect(() => {
    const getUserDetails = async () => {
      const { data } = await supabase.auth.getUser();
      if (data && data.user) {
        setUser(data.user);
      }
    };
    
    getUserDetails();
  }, []);
  
  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };
  
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Upload documents and start asking questions
        </p>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={() => router.push('/chat')}
          className="flex items-center gap-1"
          size="sm"
        >
          Ask Questions <ArrowRight className="h-4 w-4" />
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              {user?.email ? (
                <div className="flex items-center gap-2">
                  <UserCircle className="h-5 w-5" />
                  <span className="max-w-[150px] truncate">{user.email}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              ) : (
                <UserCircle className="h-5 w-5" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard')}>
              <FileText className="h-4 w-4 mr-2" />
              Documents
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push('/settings')}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut className="h-4 w-4 mr-2" />
              Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}