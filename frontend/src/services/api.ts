import { API_BASE_URL } from '../constants/config';
import { SYSTEM_PROMPT } from '../config/prompt';
import type { ChatRequest, ChatResponse } from '../types/api.types';

/**
 * Send a chat request to the backend.
 *
 * Builds Anthropic-format multimodal messages from flat parameters,
 * then POSTs to /api/chat.
 */
export async function sendChatMessage(
  text: string,
  imageBase64?: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>,
): Promise<ChatResponse> {
  // Build the messages array in multimodal format
  const messages: ChatRequest['messages'] = [];

  // Append conversation history
  if (conversationHistory && conversationHistory.length > 0) {
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Current user message — text + optional image
  const contentBlocks: Array<{ type: 'text'; text: string } | { type: 'image'; source: { type: 'base64'; media_type: 'image/jpeg'; data: string } }> = [];

  if (imageBase64) {
    contentBlocks.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: 'image/jpeg',
        data: imageBase64,
      },
    });
  }

  contentBlocks.push({
    type: 'text',
    text: text || '请描述这张图片',
  });

  messages.push({
    role: 'user',
    content: contentBlocks,
  });

  const request: ChatRequest = {
    system: SYSTEM_PROMPT,
    messages,
    stream: false,
  };

  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errBody = await response.json().catch(() => ({}));
    const message = (errBody as { error?: { message?: string } })?.error?.message
      ?? `API error: ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<ChatResponse>;
}

/**
 * Health check — returns true if backend is reachable.
 */
export async function healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return response.status === 200;
  } catch {
    return false;
  }
}
