import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { ChatMessage, ChatState } from '../types/chat.types';
import { MAX_CONVERSATION_TURNS } from '../constants/config';
import { v4 as uuidv4 } from 'uuid';

interface ChatStore extends ChatState {
  addMessage: (message: Omit<ChatMessage, 'id' | 'timestamp'>) => string;
  updateMessageStatus: (id: string, status: ChatMessage['status']) => void;
  clearHistory: () => void;
  getConversationHistory: () => Array<{ role: 'user' | 'assistant'; content: string }>;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,

      addMessage: (messageData) => {
        const id = uuidv4();
        const newMessage: ChatMessage = {
          ...messageData,
          id,
          timestamp: new Date(),
          status: messageData.status || 'sent',
        };

        set((state) => {
          const updatedMessages = [...state.messages, newMessage];

          // Keep only last N turns for sliding window
          const maxMsgs = MAX_CONVERSATION_TURNS * 2;
          const trimmedMessages = updatedMessages.slice(-maxMsgs);

          return {
            messages: trimmedMessages,
            isLoading: false,
          };
        });

        return id;
      },

      updateMessageStatus: (id, status) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, status } : msg
          ),
        }));
      },

      clearHistory: () => {
        set({ messages: [], error: null });
      },

      getConversationHistory: () => {
        const { messages } = get();
        return messages
          .filter((msg) => msg.type === 'user' || msg.type === 'assistant')
          .map((msg) => ({
            role: msg.type as 'user' | 'assistant',
            content: msg.content,
          }));
      },
    }),
    {
      name: 'chat-storage', // localStorage key
      partialize: (state) => ({ messages: state.messages }), // Only persist messages
    },
  ),
);
