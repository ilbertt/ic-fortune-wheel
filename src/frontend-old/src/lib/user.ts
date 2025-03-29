import type { UserProfile } from '@/declarations/backend/backend.did';

export const userInitials = <T extends UserProfile>(user: T): string => {
  const names = user.username
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(name => name[0].toUpperCase());
  return names.join('');
};
