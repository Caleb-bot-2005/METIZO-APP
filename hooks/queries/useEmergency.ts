import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { emergencyService } from '@/services/emergencyService';
import { CreateEmergencyRequest } from '@/types/emergency';

export function useCreateEmergencyDispatch() {
  return useMutation({ mutationFn: (input: CreateEmergencyRequest) => emergencyService.create(input) });
}

// Live price preview shown on the form, before submitting for real.
export function useEmergencyEstimate(category?: string, problemType?: string) {
  return useQuery({
    queryKey: ['emergency', 'estimate', category, problemType],
    queryFn: () => emergencyService.getEstimate(category!, problemType!),
    enabled: !!category && !!problemType,
  });
}

// Polls every 3s while SEARCHING (so the countdown/round advances feel live);
// stops once resolved (ASSIGNED/FAILED/CANCELLED) since nothing further
// changes here — payment and job progress take over from their own screens.
export function useEmergencyDispatch(requestId?: string) {
  return useQuery({
    queryKey: ['emergency', 'dispatch', requestId],
    queryFn: () => emergencyService.getStatus(requestId!),
    enabled: !!requestId,
    refetchInterval: (query) => (query.state.data?.status === 'SEARCHING' ? 3000 : false),
  });
}

export function useCancelEmergencyDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => emergencyService.cancel(requestId),
    onSuccess: (_data, requestId) => queryClient.invalidateQueries({ queryKey: ['emergency', 'dispatch', requestId] }),
  });
}

export function useRematchEmergencyDispatch() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (requestId: string) => emergencyService.rematch(requestId),
    onSuccess: (_data, requestId) => queryClient.invalidateQueries({ queryKey: ['emergency', 'dispatch', requestId] }),
  });
}

// Artisan-side: keeps polling for as long as it's mounted, so a new offer
// shows up within a few seconds of being dispatched.
export function useMyEmergencyOffers() {
  return useQuery({
    queryKey: ['emergency', 'offers', 'mine'],
    queryFn: emergencyService.myOffers,
    refetchInterval: 4000,
  });
}

export function useAcceptEmergencyOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => emergencyService.acceptOffer(offerId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['emergency', 'offers', 'mine'] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });
}

export function useDeclineEmergencyOffer() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (offerId: string) => emergencyService.declineOffer(offerId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['emergency', 'offers', 'mine'] }),
  });
}
