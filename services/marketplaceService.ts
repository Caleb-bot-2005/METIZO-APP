import { mockDelay } from './mockDelay';
import { mockMaterials, mockSuppliers } from '@/constants/mockData';
import { Material, Supplier } from '@/types/marketplace';

// No materials-marketplace endpoints on the backend yet — always mock, independent of env.useMockData.
export const marketplaceService = {
  async listMaterials(): Promise<Material[]> {
    return mockDelay(mockMaterials);
  },

  async listSuppliers(): Promise<Supplier[]> {
    return mockDelay(mockSuppliers);
  },
};
