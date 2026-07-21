import { useQuery } from '@tanstack/react-query';
import { messageService } from '@/services/messageService';

export function useConversations() {
  return useQuery({ queryKey: ['conversations'], queryFn: messageService.listConversations });
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['conversations', conversationId, 'messages'],
    queryFn: () => messageService.getMessages(conversationId),
    enabled: !!conversationId,
  });
}
