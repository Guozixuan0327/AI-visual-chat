/**
 * API types aligned with backend schema (v2 spec §3.7).
 *
 * Messages use multimodal content blocks: text + optional image.
 */

export interface ContentBlockText {
  type: 'text';
  text: string;
}

export interface ContentBlockImage {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg';
    data: string;
  };
}

export type ContentBlock = ContentBlockText | ContentBlockImage;

export interface ChatRequest {
  system: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string | ContentBlock[];
  }>;
  stream?: boolean;
}

export interface ChatResponse {
  content: Array<{ type: 'text'; text: string }>;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
  processingTime?: number;
}

export interface ApiError {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
