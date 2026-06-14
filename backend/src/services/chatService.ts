import { callQwen } from './qwen.service';
import type { ChatRequest, ChatResponse } from '../schemas';

/**
 * Chat orchestration service — lightweight layer between controller and Qwen-VL API.
 * Handles: request mapping, timing, and preparing the API-format payload.
 */
export class ChatService {
  async processMessage(input: ChatRequest): Promise<{
    response: ChatResponse;
    processingTime: number;
  }> {
    const startTime = Date.now();

    const result = await callQwen({
      system: input.system,
      messages: input.messages,
      stream: input.stream,
    });

    const processingTime = Date.now() - startTime;

    return {
      response: {
        content: result.content,
        usage: result.usage,
      },
      processingTime,
    };
  }
}

export const chatService = new ChatService();
