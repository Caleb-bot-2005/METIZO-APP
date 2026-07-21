import { useMutation, useQuery } from '@tanstack/react-query';
import { artisanService } from '@/services/artisanService';

export function useArtisans() {
  return useQuery({ queryKey: ['artisans'], queryFn: artisanService.list });
}

export function useArtisan(id: string) {
  return useQuery({ queryKey: ['artisans', id], queryFn: () => artisanService.getById(id), enabled: !!id });
}

export function useArtisanReviews(id: string) {
  return useQuery({ queryKey: ['artisans', id, 'reviews'], queryFn: () => artisanService.getReviews(id), enabled: !!id });
}

export function useTrustHistory(id: string) {
  return useQuery({ queryKey: ['artisans', id, 'trust-history'], queryFn: () => artisanService.getTrustHistory(id), enabled: !!id });
}

// Artisan-side: edit own profile.
export function useUpdateMyProfile() {
  return useMutation({
    mutationFn: (input: { category?: string; bio?: string; location?: string; available?: boolean }) =>
      artisanService.updateMyProfile(input),
  });
}
