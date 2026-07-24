import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { walletService, WalletPayPurpose } from '@/services/walletService';

export function useWalletBalance() {
  return useQuery({ queryKey: ['wallet', 'balance'], queryFn: walletService.getBalance });
}

export function usePayFromWallet() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { purpose: WalletPayPurpose; requestId?: string; amount?: number }) => walletService.pay(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['wallet', 'balance'] }),
  });
}
