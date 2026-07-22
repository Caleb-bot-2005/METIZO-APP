import { useMutation, useQuery } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';

export function useEscrow(requestId?: string) {
  return useQuery({
    queryKey: ['escrow', requestId],
    queryFn: () => paymentService.getEscrow(requestId!),
    enabled: !!requestId,
  });
}

export function useInitializePaystack() {
  return useMutation({
    mutationFn: (input: { purpose: 'ESCROW'; requestId: string } | { purpose: 'WALLET_TOPUP'; amount: number }) =>
      paymentService.initializePaystack(input),
  });
}

export function useVerifyPaystack() {
  return useMutation({ mutationFn: (reference: string) => paymentService.verifyPaystack(reference) });
}
