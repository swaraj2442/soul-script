import OpenAI from 'openai';
import { GoogleGenerativeAI, Content, Part } from '@google/generative-ai';
import { keys } from '../keys';
import { createServerSupabaseClient } from '../supabase/client';

export type AIProvider = 'gemini';

type BaseModelConfig = {
  name: string;
  embeddingModel: string;
  maxTokens: number;
  temperature: number;
  costPer1KTokens: number;
  supportsImages?: boolean;
};

type OpenAIModelConfig = BaseModelConfig & {
  provider: 'openai';
};

type GeminiModelConfig = BaseModelConfig & {
  provider: 'gemini';
  modelId: string; // Added modelId field for the actual API model identifier
};

type HuggingFaceModelConfig = BaseModelConfig & {
  provider: 'huggingface';
};

type ModelConfig = OpenAIModelConfig | GeminiModelConfig | HuggingFaceModelConfig;

// Define supported AI models and their configurations
export const AI_MODELS = {
  'gemini-2.0-flash': {
    name: 'Gemini 2.0 Flash',
    provider: 'gemini' as const,
    modelId: 'gemini-2.0-flash',
    embeddingModel: 'embedding-001',
    maxTokens: 1024,
    temperature: 0.7,
    costPer1KTokens: 0.00015
  }
} as const;

export type AIModel = keyof typeof AI_MODELS;

// Initialize AI clients
let openaiClient: OpenAI | null = null;
let geminiClient: GoogleGenerativeAI | null = null;

const getOpenAIClient = () => {
  if (!openaiClient) {
    if (!keys.openai.apiKey) {
      throw new Error('OpenAI API key is not configured');
    }
    openaiClient = new OpenAI({
      apiKey: keys.openai.apiKey,
      dangerouslyAllowBrowser: true
    });
  }
  return openaiClient;
};

const getGeminiClient = () => {
  if (!geminiClient) {
    if (!keys.gemini.apiKey) {
      console.error('Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }
    console.log('Initializing Gemini client with API key:', keys.gemini.apiKey.substring(0, 5) + '...');
    geminiClient = new GoogleGenerativeAI(keys.gemini.apiKey);
  }
  return geminiClient;
};

// Add this type guard function
function isModelConfig(config: any): config is ModelConfig {
  return config && typeof config.provider === 'string' && ['openai', 'gemini', 'huggingface'].includes(config.provider);
}

// Generate embedding for text
export const getEmbedding = async (text: string, model: AIModel = 'gemini-2.0-flash'): Promise<number[]> => {
  try {
    console.log('[Embedding] Starting embedding generation:', {
      textLength: text.length,
      model: 'embedding-001',
      timestamp: new Date().toISOString()
    });

    if (!keys.gemini.apiKey) {
      console.error('[Embedding] Gemini API key is not configured');
      throw new Error('Gemini API key is not configured');
    }

    console.log('[Embedding] Initializing Gemini client...');
    const gemini = getGeminiClient();
    
    // Use the correct model format for embeddings
    const embeddingModel = (AI_MODELS['gemini-2.0-flash'] as GeminiModelConfig).embeddingModel;
    console.log('[Embedding] Using embedding model:', embeddingModel);
    
    const geminiModel = gemini.getGenerativeModel({ model: embeddingModel });
    
    console.log('[Embedding] Sending request to Gemini...');
    const geminiResponse = await geminiModel.embedContent(text);
    
    console.log('[Embedding] Received response from Gemini:', {
      embeddingLength: geminiResponse.embedding.values.length,
      timestamp: new Date().toISOString()
    });
    
    return geminiResponse.embedding.values;
  } catch (error) {
    console.error('[Embedding] Error getting embedding:', error);
    throw error;
  }
};

// Generate chat completion
export const generateChatCompletion = async (
  messages: OpenAI.Chat.ChatCompletionMessageParam[], 
  contextText: string,
  model: AIModel = 'gemini-2.0-flash'
): Promise<string> => {
  try {
    const modelConfig = AI_MODELS[model];
    
    if (!modelConfig) {
      throw new Error(`Invalid model: ${model}`);
    }
    
    console.log('Using model:', model, 'with provider:', modelConfig.provider);
    
    // Get document summaries if available
    let summaryContext = '';
    if (contextText) {
      const supabase = createServerSupabaseClient();
      const { data: summaries } = await supabase
        .from('document_summaries')
        .select('summary')
        .eq('model', model)
        .order('created_at', { ascending: false })
        .limit(1);

      if (summaries && summaries.length > 0) {
        summaryContext = `\n\nDocument Summary:\n${summaries[0].summary}`;
      }
    }
    
    // Add system message with context
    const systemMessage: OpenAI.Chat.ChatCompletionMessageParam = {
      role: 'system',
      content: contextText ? 
        `You are a helpful assistant. Use the following context to answer the user's question:${summaryContext}\n\nRelevant Document Chunks:\n${contextText}\n\nIf the context doesn't contain relevant information, say so.` : 
        'You are a helpful assistant.'
    };

    if (modelConfig.provider === 'gemini') {
      if (!keys.gemini.apiKey) {
        console.error('Gemini API key missing');
        throw new Error('Gemini API key is not configured');
      }
      
      // Cast to GeminiModelConfig to access modelId
      const geminiConfig = modelConfig as GeminiModelConfig;
      console.log('Initializing Gemini for chat completion with model:', geminiConfig.modelId);
      
      const gemini = getGeminiClient();
      const geminiModel = gemini.getGenerativeModel({ model: geminiConfig.modelId });
      
      // Convert messages to Gemini format
      const geminiMessages = [
        systemMessage.content as string,
        ...messages.map(msg => msg.content as string)
      ].join('\n\n');

      console.log('Sending request to Gemini with messages:', geminiMessages);
      
      try {
        const geminiResponse = await geminiModel.generateContent(geminiMessages);
        console.log('Received response from Gemini');
        return geminiResponse.response.text();
      } catch (geminiError) {
        console.error('Gemini API error:', geminiError);
        throw geminiError;
      }
    }

    throw new Error('Unsupported model provider');
  } catch (error) {
    console.error('Error generating chat completion:', error);
    throw error;
  }
};