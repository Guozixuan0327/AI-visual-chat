import React from 'react';
import type { ChatMessage } from '../../types/chat.types';
import styles from './ChatInterface.module.css';

interface MessageBubbleProps {
  message: ChatMessage;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const isUser = message.type === 'user';
  const isSystem = message.type === 'system';

  if (isSystem) {
    return (
      <div className={styles.systemMessage}>
        <span>{message.content}</span>
      </div>
    );
  }

  return (
    <div className={`${styles.messageWrapper} ${isUser ? styles.userWrapper : styles.assistantWrapper}`}>
      <div className={`${styles.messageBubble} ${isUser ? styles.userBubble : styles.assistantBubble}`}>
        {message.attachments?.map((attachment, index) => (
          attachment.type === 'image' && (
            <div key={index} className={styles.imageAttachment}>
              <img src={attachment.data} alt="Captured frame" />
            </div>
          )
        ))}
        <div className={styles.messageContent}>{message.content}</div>
        <div className={styles.messageMeta}>
          <span className={styles.timestamp}>
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
          {message.metadata?.processingTime && (
            <span className={styles.processingTime}>
              {message.metadata.processingTime}ms
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
