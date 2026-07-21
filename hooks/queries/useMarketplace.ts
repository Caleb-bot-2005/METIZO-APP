import { useQuery } from '@tanstack/react-query';
import { marketplaceService } from '@/services/marketplaceService';

export function useMaterials() {
  return useQuery({ queryKey: ['materials'], queryFn: marketplaceService.listMaterials });
}

export function useSuppliers() {
  return useQuery({ queryKey: ['suppliers'], queryFn: marketplaceService.listSuppliers });
}
