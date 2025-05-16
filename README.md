# Document Chat Application

A modern web application that allows users to upload documents, process them using AI, and chat with the content using natural language.

## Project Overview

This application enables users to:
- Upload various document formats (PDF, TXT, DOCX)
- Process documents using AI for better understanding
- Chat with the document content using natural language
- Get AI-generated summaries and insights
- Search through document content efficiently

## Technical Implementation

### 1. Database Schema

The application uses Supabase as the backend with the following main tables:

#### Documents Table
```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_size BIGINT NOT NULL,
  mime_type TEXT NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Document Chunks Table
```sql
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  embedding vector(768),
  chunk_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

#### Conversations and Messages
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 2. Document Processing Flow

1. **Upload Process**
   - User selects a document (PDF, TXT, or DOCX)
   - File is uploaded to Supabase Storage
   - Initial document record is created with 'pending' status
   - File is processed for text extraction

2. **Processing Pipeline**
   - Document is split into manageable chunks
   - Each chunk is processed for embeddings
   - Embeddings are stored in the document_chunks table
   - Status is updated to 'completed' when done

3. **Chat Interface**
   - Users can start conversations about documents
   - Messages are stored with user/assistant roles
   - Context is maintained using document chunks
   - Citations are provided for answers

### 3. Key Features

#### Document Management
- Secure file upload with progress tracking
- Support for multiple file formats
- File size limits and validation
- Status tracking and error handling

#### AI Integration
- Document chunking and embedding generation
- Semantic search capabilities
- Natural language processing
- Context-aware responses

#### User Interface
- Modern, responsive design
- Real-time status updates
- Interactive chat interface
- Document preview and management

### 4. Security Implementation

1. **Authentication**
   - Supabase Auth integration
   - JWT token-based authentication
   - Secure session management

2. **Authorization**
   - Row Level Security (RLS) policies
   - User-specific data access
   - Secure file storage

3. **Data Protection**
   - Encrypted file storage
   - Secure API endpoints
   - Input validation and sanitization

### 5. API Structure

#### Document Endpoints
- `POST /api/documents/upload` - Upload new document
- `GET /api/documents` - List user's documents
- `PATCH /api/documents/:id` - Update document status
- `DELETE /api/documents/:id` - Remove document

#### Chat Endpoints
- `POST /api/chat` - Send message
- `GET /api/chat/:id` - Get conversation history
- `POST /api/chat/summarize` - Generate document summary

### 6. Frontend Components

#### Core Components
- `DocumentUpload` - File upload interface
- `DocumentList` - Document management
- `ChatInterface` - Conversation UI
- `SpeechInput` - Voice input support

#### UI Features
- Progress indicators
- Status badges
- Error handling
- Loading states

### 7. Development Setup

1. **Prerequisites**
   - Node.js 18+
   - Supabase account
   - OpenAI API key

2. **Environment Setup**
   ```bash
   # Install dependencies
   npm install

   # Set up environment variables
   cp .env.example .env.local
   ```

3. **Database Setup**
   ```bash
   # Apply migrations
   supabase db push
   ```

4. **Development Server**
   ```bash
   npm run dev
   ```

### 8. Deployment

1. **Build Process**
   ```bash
   npm run build
   ```

2. **Environment Configuration**
   - Set production environment variables
   - Configure Supabase project
   - Set up storage buckets

3. **Deployment Steps**
   - Deploy to Vercel/Netlify
   - Configure production database
   - Set up monitoring

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.