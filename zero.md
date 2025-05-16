# Application Flow Documentation

## Overview
This application uses Bull MQ for handling asynchronous document processing with Redis as the backend. The system is built with Next.js and uses Supabase for authentication and data storage.

## Key Files to Understand the Flow

### 1. Queue Setup and Configuration
**File**: `lib/queue/config.ts`
- Defines queue name and configuration
- Sets up Redis connection settings
- Configures worker options (concurrency, lock duration)
- Essential for understanding how the queue is structured

### 2. Queue Client
**File**: `lib/queue/client.ts`
- Creates Redis connection with error handling
- Initializes the document processing queue
- Provides queue status monitoring functions
- Shows how jobs are added to the queue

### 3. Queue Worker
**File**: `lib/queue/worker.ts`
- Implements the actual document processing logic
- Handles job processing with error handling
- Updates document status in Supabase
- Shows how jobs are processed from the queue

### 4. Queue Status UI
**File**: `components/dashboard/queue-status.tsx`
- Displays queue statistics in the UI
- Shows real-time status of documents
- Demonstrates how to monitor queue health
- Provides user-friendly interface for queue monitoring

### 5. Queue Status API
**File**: `app/api/queue-status/route.ts`
- Exposes queue status via API
- Handles authentication
- Integrates with Supabase
- Shows how to securely expose queue information

### 6. Docker Setup
**File**: `Dockerfile`
- Shows how the system is deployed
- Includes Redis setup
- Configures worker process
- Demonstrates production deployment

## Flow Explanation

1. **Document Upload Flow**:
   - User uploads a document
   - Document is added to the queue via `client.ts`
   - Status is tracked in Supabase

2. **Processing Flow**:
   - Worker (`worker.ts`) picks up jobs from queue
   - Processes documents with retry logic
   - Updates status in Supabase
   - Handles errors and failures

3. **Monitoring Flow**:
   - Queue status is exposed via API
   - UI component displays real-time status
   - Users can monitor their documents

4. **Error Handling**:
   - Automatic retries for failed jobs
   - Error logging and status updates
   - User notification of failures

## Key Features

1. **Reliability**:
   - Automatic retries
   - Error handling
   - Status tracking

2. **Scalability**:
   - Concurrent processing
   - Redis backend
   - Worker separation

3. **Monitoring**:
   - Real-time status
   - Queue statistics
   - User document tracking

4. **Security**:
   - Authentication integration
   - Secure API endpoints
   - User-specific queues

## Best Practices Demonstrated

1. **Error Handling**:
   - Comprehensive error catching
   - Status updates
   - User notifications

2. **Configuration**:
   - Centralized config
   - Environment variables
   - Flexible settings

3. **Monitoring**:
   - Real-time updates
   - Status tracking
   - Performance metrics

4. **Deployment**:
   - Docker containerization
   - Process management
   - Production readiness 