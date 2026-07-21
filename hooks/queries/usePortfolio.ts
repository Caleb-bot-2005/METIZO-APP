import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { portfolioService } from '@/services/portfolioService';

export function useArtisanPortfolio(userId: string) {
  return useQuery({
    queryKey: ['artisans', userId, 'portfolio'],
    queryFn: () => portfolioService.list(userId),
    enabled: !!userId,
  });
}

export function useUploadPortfolioPhoto(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { uri: string; caption?: string }) => portfolioService.upload(input.uri, input.caption),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisans', userId, 'portfolio'] });
    },
  });
}

export function useDeletePortfolioPhoto(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (photoId: string) => portfolioService.remove(photoId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['artisans', userId, 'portfolio'] });
    },
  });
}
