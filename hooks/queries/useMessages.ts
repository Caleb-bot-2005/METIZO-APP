import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';

// Polls so the conversation list (new messages, previews) updates on its own —
// shared by both the customer and artisan message tabs.
export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: messageService.listConversations, refetchInterval: 5000 });
}

// Faster poll while a thread is actually open, for a closer-to-live chat feel.
export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => messageService.getMessages(conversationId),
    enabled: !!conversationId,
    refetchInterval: 3000,
  });
}
