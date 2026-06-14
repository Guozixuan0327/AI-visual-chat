import { z } from 'zod';

/**
 * Content Block: text or image
 * Used for building messages in multimodal API format.
 */
const TextContentBlock = z.object({
  type: z.literal('text'),
  text: z.string(),
});

const ImageContentBlock = z.object({
  type: z.literal('image'),
  source: z.object({
    type: z.literal('base64'),
    media_type: z.literal('image/jpeg'),
    data: z.string(),
  }),
});

const ContentBlock = z.union([TextContentBlock, ImageContentBlock]);

/**
 * Chat request schema (v2 spec §3.7).
 * Messages use multimodal content blocks (text + image).
 */
export const ChatRequestSchema = z.object({
  system: z.string(),
  messages: z.array(
    z.object({
      role: z.enum(['user', 'assistant']),
      content: z.union([z.string(), z.array(ContentBlock)]),
    }),
  ),
  stream: z.boolean().optional().default(false),
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;

/**
 * Chat response shape returned by the controller.
 */
export interface ChatResponse {
  content: Array<{ type: 'text'; text: string }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
