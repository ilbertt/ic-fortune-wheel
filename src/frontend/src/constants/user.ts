import { type UserRole } from '@/declarations/backend/backend.did';
import type {
  DropdownElement,
  ExtractKeysFromCandidEnum,
} from '@/lib/types/utils';

export const USER_ROLES: Record<ExtractKeysFromCandidEnum<UserRole>, string> = {
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
