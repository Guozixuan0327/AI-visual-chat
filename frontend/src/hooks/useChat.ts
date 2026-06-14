import { useState, useCallback } from 'react';
import { useChatStore } from '../store/chatStore';
import { useCostStore } from '../store/costStore';
import { useExperimentStore } from '../store/experimentStore';
import { sendChatMessage } from '../services/api';
import { estimateImageTokens } from '../lib/costEstimator';
import type { ChatMessage } from '../types/chat.types';

interface UseChatReturn {
  sendMessage: (content: string, imageDims?: { width: number; height: number }, imageBase64?: string) => Promise<string | null>;
  isLoading: boolean;
  error: string | null;
}

export function useChat(): UseChatReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { addMessage, getConversationHistory } = useChatStore();
  const recordTurn = useCostStore((s) => s.recordTurn);
  const recordExperiment = useExperimentStore((s) => s.recordEntry);

  const sendMessage = useCallback(
    async (content: string, imageDims?: { width: number; height: number }, imageBase64?: string): Promise<string | null> => {
      if (!content.trim() && !imageBase64) return null;

      const t0 = performance.now();
      setIsLoading(true);
      setError(null);

      const userMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
        type: 'user',
        content: content || '[Image]',
        attachments: imageBase64 ? [{ type: 'image' as const, data: imageBase64 }] : undefined,
        metadata: { frameCaptured: !!imageBase64 },
      };

      addMessage(userMessage);

      try {
        const conversationHistory = getConversationHistory();
        const response = await sendChatMessage(content, imageBase64, conversationHistory.slice(-5));

        const replyText = response.content
          .filter((b) => b.type === 'text')
          .map((b) => b.text)
          .join('');

        const latencyMs = performance.now() - t0;

        // --- cost tracking (prefer real API usage over estimates) ---
        const realUsage = response.usage;
        const inputTokens = realUsage?.input_tokens 
          ?? (imageDims ? estimateImageTokens(imageDims.width, imageDims.height) + content.length / 1.5 : content.length / 1.5);
        const outputTokens = realUsage?.output_tokens ?? replyText.length / 1.5;
        const turnCost = (inputTokens / 1e6) * 0.41 + (outputTokens / 1e6) * 1.23;

        recordTurn({
          imageSent: !!imageBase64,
          imageDims,
          userText: content,
          assistantText: replyText,
          apiInputTokens: realUsage?.input_tokens,
          apiOutputTokens: realUsage?.output_tokens,
        });

        // --- experiment log ---
        recordExperiment({
          timestamp: Date.now(),
          latencyMs: Math.round(latencyMs),
          imageSent: !!imageBase64,
          imageTokens: imageDims ? estimateImageTokens(imageDims.width, imageDims.height) : 0,
          textTokens: Math.round(inputTokens + outputTokens),
          totalCostUSD: turnCost,
        });

        const assistantMessage: Omit<ChatMessage, 'id' | 'timestamp'> = {
          type: 'assistant',
          content: replyText,
          metadata: { processingTime: response.processingTime },
        };

        addMessage(assistantMessage);
        return replyText;
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to send message');
        addMessage({
          type: 'system',
          content: `Error: ${err instanceof Error ? err.message : 'Unknown error occurred'}`,
        });
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addMessage, getConversationHistory, recordTurn, recordExperiment],
  );

  return { sendMessage, isLoading, error };
}
