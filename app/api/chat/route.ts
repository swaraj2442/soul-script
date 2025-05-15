import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { getChatCompletion } from '@/lib/openai/client';

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the request body
    const { message, context } = await req.json();

    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // Prepare the system message with context
    const systemMessage = context
      ? `You are a helpful AI assistant. Use the following context from the user's documents to answer their question. If the context doesn't contain relevant information, say so and provide a general answer.

Context:
${context}

Remember to:
1. Use the context to provide accurate and relevant answers
2. If the context doesn't help, provide a general answer
3. Be concise and clear in your responses
4. If you're unsure about something, say so`
      : 'You are a helpful AI assistant. Provide clear and concise answers to the user\'s questions.';

    // Get chat completion from OpenAI
    const response = await getChatCompletion([
      { role: 'system', content: systemMessage },
      { role: 'user', content: message }
    ]);

    return NextResponse.json({
      message: response
    });

  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 