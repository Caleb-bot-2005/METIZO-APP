import { useMutation, useQuery } from '@tanstack/react-query';
import { artisanService } from '@/services/artisanService';

// Polls every 5s so the home screen's "Nearby Artisans" section picks up new
// artisans (or one going online/setting their location) without a manual
// refresh — matches the rest of the app's live-ish feel (job feed, offers).
export function useArtisans() {
  return useQuery({ queryKey: ['artisans'], queryFn: artisanService.list, refetchInterval: 5000 });
}

export function useArtisan(id: string) {
  return useQuery({ queryKey: ['artisans', id], queryFn: () => artisanService.getById(id), enabled: !!id });
}

// Available artisans in one category — used by emergency dispatch.
export function useArtisansByCategory(category?: string) {
  return useQuery({
    queryKey: ['artisans', 'match', category],
    queryFn: () => artisanService.matchByCategory(category!),
    enabled: !!category,
  });
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
    mutationFn: (input: {
      category?: string;
      bio?: string;
      location?: string;
      latitude?: number;
      longitude?: number;
      available?: boolean;
    }) => artisanService.updateMyProfile(input),
  });
}
