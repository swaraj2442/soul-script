import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { getQueueStatus, testRedisConnection } from '@/lib/queue/client';

// Mark route as dynamic
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface DocumentCount {
  status: string;
  count: string;
}

interface UserStats {
  pending: number;
  processing: number;
  completed: number;
  failed: number;
  total: number;
}

// Helper function to validate document counts
function isValidDocumentCount(data: any): data is DocumentCount[] {
  return Array.isArray(data) && data.every(item => 
    typeof item === 'object' &&
    item !== null &&
    typeof item.status === 'string' &&
    typeof item.count === 'string'
  );
}

// Helper function to format user stats
function formatUserStats(data: DocumentCount[]): UserStats {
  const stats: UserStats = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0,
    total: 0
  };

  data.forEach(item => {
    if (item.status in stats) {
      const count = parseInt(item.count);
      if (!isNaN(count)) {
        stats[item.status as keyof UserStats] = count;
        stats.total += count;
      }
    }
  });

  return stats;
}

export async function GET(req: NextRequest) {
  try {
    // Step 1: Validate authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: 'Missing or invalid authorization header'
        },
        { status: 401 }
      );
    }

    // Step 2: Initialize Supabase client
    const supabase = createServerSupabaseClient();
    
    // Step 3: Authenticate user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      return NextResponse.json(
        { 
          error: 'Unauthorized',
          details: authError?.message || 'User not found'
        },
        { status: 401 }
      );
    }
    
    // Step 4: Fetch document counts
    const { data, error } = await supabase.rpc('get_document_counts', {
      user_id: user.id
    });
    
    if (error) {
      return NextResponse.json(
        { 
          error: 'Failed to fetch document stats',
          details: error.message,
          code: error.code,
          hint: error.hint
        },
        { status: 500 }
      );
    }
    
    if (!data) {
      return NextResponse.json(
        { 
          error: 'No document stats returned',
          details: 'The database query returned no results',
          userId: user.id
        },
        { status: 500 }
      );
    }

    // Step 5: Validate and format document counts
    if (!isValidDocumentCount(data)) {
      return NextResponse.json(
        { 
          error: 'Invalid document count format',
          details: 'The database returned data in an unexpected format',
          data
        },
        { status: 500 }
      );
    }

    const userStats = formatUserStats(data);
    
    // Step 6: Test Redis connection and get queue status
    let queueStatus = {
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      total: 0,
    };
    
    let redisConnected = false;
    
    try {
      redisConnected = await testRedisConnection();
      
      if (!redisConnected) {
        return NextResponse.json({
          userDocuments: userStats,
          queueStatus,
          redisConnected: false,
          error: 'Redis connection failed',
          details: 'Could not establish connection to Redis server'
        });
      }

      // Step 7: Get queue status
      const status = await getQueueStatus();
      
      if (status.error) {
        return NextResponse.json({
          userDocuments: userStats,
          queueStatus,
          redisConnected: true,
          error: 'Failed to get queue status',
          details: status.error
        });
      }

      queueStatus = status;
      
    } catch (error) {
      return NextResponse.json({
        userDocuments: userStats,
        queueStatus,
        redisConnected: false,
        error: 'Failed to connect to Redis',
        details: error instanceof Error ? error.message : 'Unknown error'
      });
    }
    
    // Step 8: Return success response
    return NextResponse.json({
      userDocuments: userStats,
      queueStatus,
      redisConnected: true
    });
    
  } catch (error) {
    console.error('Queue status API: Unexpected error', {
      error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}