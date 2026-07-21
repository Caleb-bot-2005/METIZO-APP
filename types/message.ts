export interface Conversation {
  id: string;
  participantName: string;
  participantAvatarUrl: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  online: boolean;
}

export type MessageKind = 'text' | 'image' | 'voice' | 'location' | 'quick_reply';

export interface ChatMessage {
  id: string;
  conversationId: string;
  sender: 'me' | 'them';
  kind: MessageKind;
  content: string;
  createdAt: string;
  read: boolean;
  durationSeconds?: number;
}
