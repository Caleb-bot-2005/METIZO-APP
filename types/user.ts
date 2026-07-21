export type UserRole = 'customer' | 'artisan' | 'business';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  avatarUrl?: string;
  role: UserRole;
  createdAt: string;
}

export interface Address {
  id: string;
  label: 'Home' | 'Work' | 'Other';
  line1: string;
  city: string;
  latitude: number;
  longitude: number;
  isDefault?: boolean;
}
