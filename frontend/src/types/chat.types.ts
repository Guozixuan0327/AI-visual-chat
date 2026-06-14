export type MessageType = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  type: MessageType;
  content: string;
  timestamp: Date;
  attachments?: {
    type: 'image' | 'audio';
    data: string; // base64 or URL
    thumbnail?: string;
  }[];
  metadata?: {
    frameCaptured?: boolean;
    processingTime?: number;
  };
  status?: 'sending' | 'sent' | 'error';
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}
