import { UserRole } from '@/types/user';

/** Where a signed-in user lands: artisans get their own tab experience. */
export function getHomeRoute(role?: UserRole): '/(tabs)' | '/(artisan-tabs)' {
  return role === 'artisan' ? '/(artisan-tabs)' : '/(tabs)';
}
