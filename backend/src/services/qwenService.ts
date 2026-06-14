import axios from 'axios';
import { config } from '../config/environment';
import logger from '../utils/logger';

interface QwenMessage {
  role: 'user' | 'assistant' | 'system';
  content: Array<{
    image?: string;
    text?: string;
  }>;
}

interface QwenRequest {
  model: string;
  input: {
    messages: QwenMessage[];
  };
  parameters?: {
    top_p?: number;
    temperature?: number;
    max_tokens?: number;
  };
}

interface QwenResponse {
  output: {
    choices: Array<{
      message: {
        role: string;
        content: string;
      };
    }>;
  };
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

export class QwenService {
  private apiKey: string;
  private apiEndpoint: string;
  private model: string;

  constructor() {
    this.apiKey = `${config.ALIBABA_CLOUD_ACCESS_KEY_ID}:${config.ALIBABA_CLOUD_ACCESS_KEY_SECRET}`;
    this.apiEndpoint = config.QWEN_VL_API_ENDPOINT;
    this.model = config.QWEN_VL_MODEL;
  }

  async chat(
    userMessage: string,
    imageBase64?: string,
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>
  ): Promise<{ message: string; tokenUsage?: any }> {
    const startTime = Date.now();

    try {
      // Build messages array
      const messages: QwenMessage[] = [];

      // Add conversation history if provided
      if (conversationHistory && conversationHistory.length > 0) {
        for (const msg of conversationHistory) {
          messages.push({
            role: msg.role,
            content: [{ text: msg.content }],
          });
        }
      }

      // Add current user message with optional image
      const userContent: Array<{ image?: string; text?: string }> = [];

      if (imageBase64) {
        userContent.push({ image: imageBase64 });
      }

      if (userMessage) {
        userContent.push({ text: userMessage || '请描述这张图片' });
      }

      messages.push({
        role: 'user',
        content: userContent,
      });

      // Build request
      const request: QwenRequest = {
        model: this.model,
        input: { messages },
        parameters: {
          temperature: 0.7,
          max_tokens: 500,
          top_p: 0.8,
        },
      };

      logger.info('Sending request to Qwen-VL API');

      // Make API call
      const response = await axios.post<QwenResponse>(this.apiEndpoint, request, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.ALIBABA_CLOUD_ACCESS_KEY_ID}`,
          'X-DashScope-SSE': 'disable',
        },
        timeout: 30000, // 30 second timeout
      });

      const processingTime = Date.now() - startTime;

      // Parse response
      const aiMessage = response.data.output.choices[0]?.message?.content || '抱歉，我无法理解这个请求。';

      logger.info(`Qwen-VL response received in ${processingTime}ms`);

      return {
        message: aiMessage,
        processingTime,
        tokenUsage: response.data.usage ? {
          promptTokens: response.data.usage.input_tokens,
          completionTokens: response.data.usage.output_tokens,
          totalTokens: response.data.usage.total_tokens,
        } : undefined,
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      if (axios.isAxiosError(error)) {
        logger.error('Qwen-VL API error:', {
          status: error.response?.status,
          data: error.response?.data,
          processingTime,
        });

        if (error.response?.status === 429) {
          throw new Error('API rate limit exceeded. Please try again later.');
        }

        if (error.response?.status === 401) {
          throw new Error('Invalid API credentials. Please check your configuration.');
        }

        throw new Error(`AI service error: ${error.response?.data?.message || error.message}`);
      }

      logger.error('Unexpected error in QwenService:', error);
      throw new Error('Failed to process request. Please try again.');
    }
  }
}

export const qwenService = new QwenService();
