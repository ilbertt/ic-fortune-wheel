import { UserRole } from '@/lib/api/backend/backend';
import type { DropdownElement } from '@/lib/types/utils';

export const USER_ROLES: Record<UserRole, string> = {
  admin: 'Admin',
  scanner: 'Scanner',
  unassigned: 'Unassigned',
};

export const USER_ROLE_OPTIONS = Object.entries(USER_ROLES).map(
  ([key, value]) => ({
    value: key,
    label: value,
  }),
) satisfies DropdownElement[];
