import { z } from 'zod';

export const chatRequestSchema = z.object({
  message: z.string().min(1, 'Message is required'),
  image: z.string().optional(), // base64 encoded image
  conversationHistory: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string(),
    })
  ).optional(),
});

export type ChatRequest = z.infer<typeof chatRequestSchema>;

export interface ChatResponse {
  message: string;
  processingTime?: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
