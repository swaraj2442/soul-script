import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/client';
import { processDocument } from '@/lib/services/document-processor';
import { v4 as uuidv4 } from 'uuid';

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

    // Get the form data
    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = [
      'application/pdf',
      'text/plain',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      );
    }

    // Generate a unique file path
    const fileId = uuidv4();
    const filePath = `${user.id}/${fileId}-${file.name}`;

    // Upload file to Supabase Storage
    const { error: uploadError } = await supabase
      .storage
      .from('documents')
      .upload(filePath, file);

    if (uploadError) {
      return NextResponse.json(
        { error: 'Failed to upload file' },
        { status: 500 }
      );
    }

    // Create document record
    const { data: document, error: insertError } = await supabase
      .from('documents')
      .insert({
        id: fileId,
        user_id: user.id,
        name: file.name,
        file_path: filePath,
        status: 'pending',
        file_size: file.size,
        mime_type: file.type
      })
      .select()
      .single();

    if (insertError || !document) {
      // Clean up uploaded file if document creation fails
      await supabase
        .storage
        .from('documents')
        .remove([filePath]);

      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      );
    }

    // Process the document
    try {
      await processDocument(
        document.id,
        document.file_path,
        document.mime_type,
        user.id
      );
    } catch (error) {
      console.error('Document processing error:', error);
      // Don't return error here, as the document is still created
      // The error will be stored in the document record
    }

    return NextResponse.json({
      document,
      message: 'Document uploaded successfully'
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 