import type {
  WheelAsset,
  WheelAssetType,
} from '@/declarations/backend/backend.did';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { enumKey } from '@/lib/utils';
import { atom, type SetStateAction } from 'jotai';

export const formAssetTypeAtom =
  atom<ExtractKeysFromCandidEnum<WheelAssetType> | null>(null);

export const wheelAssetToEdit = atom<
  WheelAsset | null,
  [SetStateAction<WheelAsset | null>],
  void
>(null, (get, set, update) => {
  const newAsset =
    typeof update === 'function' ? update(get(wheelAssetToEdit)) : update;
  set(formAssetTypeAtom, newAsset ? enumKey(newAsset.asset_type) : null);
  set(wheelAssetToEdit, newAsset);
});
