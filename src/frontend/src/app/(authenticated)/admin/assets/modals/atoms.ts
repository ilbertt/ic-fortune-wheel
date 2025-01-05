import type { WheelAssetType } from '@/declarations/backend/backend.did';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { atom } from 'jotai';

export const createAssetTypeAtom =
  atom<ExtractKeysFromCandidEnum<WheelAssetType> | null>(null);
