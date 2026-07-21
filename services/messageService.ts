import { mockDelay } from './mockDelay';
import { mockConversations, mockMessages } from '@/constants/mockData';
import { ChatMessage, Conversation } from '@/types/message';

// No messaging endpoints on the backend yet — always mock, independent of env.useMockData.
export const messageService = {
  async listConversations(): Promise<Conversation[]> {
    return mockDelay(mockConversations);
  },

  async getMessages(conversationId: string): Promise<ChatMessage[]> {
    return mockDelay(mockMessages.filter((m) => m.conversationId === conversationId));
  },
};
