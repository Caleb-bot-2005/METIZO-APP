import { mockDelay } from './mockDelay';
import { ChatMessage, Conversation } from '@/types/message';

// No messaging endpoints on the backend yet, so there's nothing real to fetch —
// starts empty (a fresh account genuinely has no conversations) rather than
// showing fabricated chat history. Messages sent locally still work via
// messageStore.sendMessage; they just don't persist across app restarts or
// sync with a real other party until a real backend exists.
export const messageService = {
  async listConversations(): Promise<Conversation[]> {
    return mockDelay([]);
  },

  async getMessages(_conversationId: string): Promise<ChatMessage[]> {
    return mockDelay([]);
  },
};
