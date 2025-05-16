import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { getEmbedding, generateChatCompletion } from '@/lib/openai/client';
import { v4 as uuidv4 } from 'uuid';

// Mark route as dynamic
export const dynamic = 'force-dynamic';

interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  similarity: number;
}

export async function POST(req: NextRequest) {
  try {
    // Get the authorization header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error('Missing or invalid authorization header');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Create Supabase client
    const supabase = createServerSupabaseClient();
    
    // Get the current user using the token
    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.split(' ')[1]
    );
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Get request body
    const body = await req.json();
    const { question, conversationId, previousMessages = [], model = 'auto', documentId } = body;
    
    if (!question) {
      return NextResponse.json(
        { error: 'Question is required' },
        { status: 400 }
      );
    }

    if (!documentId) {
      return NextResponse.json(
        { error: 'Document ID is required' },
        { status: 400 }
      );
    }
    
    console.log('Processing question:', {
      question,
      conversationId,
      messageCount: previousMessages.length,
      model,
      documentId
    });
    
    // Create conversation if no conversationId provided
    let finalConversationId = conversationId;
    if (!finalConversationId) {
      const { data: conversation, error: createError } = await supabase
        .from('conversations')
        .insert({
          id: uuidv4(),
          user_id: user.id,
          title: question.substring(0, 100),
        })
        .select('id')
        .single();
      
      if (createError || !conversation) {
        console.error('Error creating conversation:', createError);
        return NextResponse.json(
          { error: 'Failed to create conversation' },
          { status: 500 }
        );
      }
      
      finalConversationId = conversation.id;
    }
    
    // Save user's question
    const messageId = uuidv4();
    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        id: messageId,
        conversation_id: finalConversationId,
        role: 'user',
        content: question,
      });
    
    if (messageError) {
      console.error('Error saving user message:', messageError);
      return NextResponse.json(
        { error: 'Failed to save message' },
        { status: 500 }
      );
    }
    
    try {
      // Generate embedding for the question
      console.log('Generating embedding for question...');
      const questionEmbedding = await getEmbedding(question, 'gemini-2.0-flash');
      console.log('Embedding generated successfully');
      
      // Search for relevant document chunks from the specific document
      console.log('Searching for relevant chunks...');
      const { data: relevantChunks, error: searchError } = await supabase.rpc(
        'match_documents',
        {
          target_document_id: documentId,
          match_count: 8,
          match_threshold: 0.5,
          query_embedding: questionEmbedding,
          user_id: user.id
        }
      );
      
      if (searchError) {
        console.error('Vector search error:', searchError);
        return NextResponse.json(
          { error: 'Failed to search documents' },
          { status: 500 }
        );
      }
      
      console.log('Found relevant chunks:', relevantChunks?.length || 0);
      
      // Format context from relevant chunks
      let contextText = '';
      if (relevantChunks && relevantChunks.length > 0) {
        contextText = `Document Context:\n\n` +
          relevantChunks
            .map((chunk: DocumentChunk, i: number) => `[${i + 1}] ${chunk.content}`)
            .join('\n\n');
      }
      
      // Format conversation history
      const messageHistory = previousMessages.map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));
      
      // Add system message to instruct the model
      messageHistory.unshift({
        role: 'system',
        content: `You are a knowledgeable assistant with two main capabilities:
1. Answer questions about the document content using the provided document context
2. Enhance your answers with relevant external knowledge when appropriate

When answering questions:
1. First, use the information from the provided document context
2. If the document context is insufficient or you can provide additional valuable insights:
   - Add relevant external knowledge to complement the document content
   - Clearly distinguish between document content and external information
   - Cite sources when possible
3. If the document context doesn't contain relevant information:
   - Provide a general answer based on your knowledge
   - Explain that the information is not from the document
   - Offer to elaborate further if needed

For document improvement requests:
- Analyze the current content
- Provide specific, actionable suggestions
- Include examples and best practices from your knowledge
- Focus on making the document more effective and comprehensive

Remember to:
- Be clear about which information comes from the document vs. external sources
- Maintain accuracy and relevance
- Provide comprehensive but concise answers
- Use a helpful and professional tone`
      });
      
      // Add the current question
      messageHistory.push({
        role: 'user',
        content: question,
      });
      
      // Generate response using selected model
      console.log('Generating chat completion...');
      const response = await generateChatCompletion(
        messageHistory, 
        contextText,
        'gemini-2.0-flash'
      );
      console.log('Chat completion generated successfully');
      
      // Save the assistant's response
      const responseMessageId = uuidv4();
      const { error: responseError } = await supabase
        .from('messages')
        .insert({
          id: responseMessageId,
          conversation_id: finalConversationId,
          role: 'assistant',
          content: response || 'Failed to generate response',
        });
      
      if (responseError) {
        console.error('Error saving assistant message:', responseError);
      }
      
      // Add citations if we have relevant chunks
      if (relevantChunks && relevantChunks.length > 0) {
        const citations = relevantChunks.map((chunk: DocumentChunk) => ({
          id: uuidv4(),
          message_id: responseMessageId,
          document_id: chunk.document_id,
          chunk_id: chunk.id,
          start_char: 0, // Simplified for now
          end_char: chunk.content.length,
        }));
        
        const { error: citationError } = await supabase
          .from('citations')
          .insert(citations);
        
        if (citationError) {
          console.error('Error saving citations:', citationError);
        }
      }
      
      // Return the response
      return NextResponse.json({
        answer: response,
        conversationId: finalConversationId,
        sources: relevantChunks?.map((chunk: DocumentChunk) => ({
          document_id: chunk.document_id,
          chunk_id: chunk.id,
          content: chunk.content.substring(0, 200) + '...',
          similarity: chunk.similarity,
        })) || [],
      });
      
    } catch (error) {
      console.error('Error in question processing:', error);
      return NextResponse.json(
        { 
          error: 'Failed to process question',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Ask question error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}