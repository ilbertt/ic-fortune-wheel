import type { UserProfile } from '@/lib/api/backend/backend';

export const userInitials = <T extends UserProfile>(user: T): string => {
  const names = user.username
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(name => name[0].toUpperCase());
  return names.join('');
};
