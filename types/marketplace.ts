export interface Material {
  id: string;
  name: string;
  category: string;
  price: number;
  unit: string;
  imageUrl: string;
  supplierId: string;
  supplierName: string;
  rating: number;
  inStock: boolean;
}

export interface CartItem {
  material: Material;
  quantity: number;
}

export interface Supplier {
  id: string;
  name: string;
  logoUrl: string;
  rating: number;
  deliveryEtaDays: number;
  location: string;
}

export type OrderStatus = 'preparing' | 'out_for_delivery' | 'delivered';

export interface Order {
  id: string;
  items: CartItem[];
  subtotal: number;
  delivery: number;
  total: number;
  address: string;
  status: OrderStatus;
  createdAt: string;
}
