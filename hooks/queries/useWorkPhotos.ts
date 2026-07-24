import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { workPhotoService } from '@/services/workPhotoService';

export function useWorkPhotos(requestId?: string) {
  return useQuery({
    queryKey: ['jobs', requestId, 'photos'],
    queryFn: () => workPhotoService.list(requestId!),
    enabled: !!requestId,
  });
}

export function useUploadWorkPhoto(requestId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ type, uri }: { type: 'before' | 'after'; uri: string }) =>
      workPhotoService.upload(requestId, type, uri),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs', requestId, 'photos'] }),
  });
}
