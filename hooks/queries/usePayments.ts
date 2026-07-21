import { useMutation } from '@tanstack/react-query';
import { paymentService } from '@/services/paymentService';

export function useCreateEscrow() {
  return useMutation({
    mutationFn: ({ jobId, amount, methodId }: { jobId: string; amount: number; methodId: string }) =>
      paymentService.createEscrow(jobId, amount, methodId),
  });
}

export function useReleaseEscrow() {
  return useMutation({ mutationFn: (escrowId: string) => paymentService.release(escrowId) });
}
