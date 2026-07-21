import { create } from 'zustand';
import { ChatMessage, Conversation } from '@/types/message';

interface MessageState {
  conversations: Conversation[];
  messages: Record<string, ChatMessage[]>;
  setConversations: (conversations: Conversation[]) => void;
  setMessages: (conversationId: string, messages: ChatMessage[]) => void;
  sendMessage: (message: ChatMessage) => void;
}

export const useMessageStore = create<MessageState>((set) => ({
  conversations: [],
  messages: {},
  setConversations: (conversations) => set({ conversations }),
  setMessages: (conversationId, messages) =>
    set((s) => ({ messages: { ...s.messages, [conversationId]: messages } })),
  sendMessage: (message) =>
    set((s) => ({
      messages: {
        ...s.messages,
        [message.conversationId]: [...(s.messages[message.conversationId] ?? []), message],
      },
    })),
}));
