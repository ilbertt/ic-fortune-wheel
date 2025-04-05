import { WheelAsset } from '@/declarations/backend/backend.did';
import { useWheelAssets } from './use-wheel-assets';
import { useCallback } from 'react';

type UseWheelAssetReturnType = {
  data: WheelAsset | null | undefined;
  fetchingWheelAsset: boolean;
};

export const useWheelAsset = (id: string): UseWheelAssetReturnType => {
  const { data, fetchingAssets } = useWheelAssets(
    useCallback(
      (data: WheelAsset[]) => data.find(el => el.id === id) || null,
      [id],
    ),
  );

  return {
    data,
    fetchingWheelAsset: fetchingAssets,
  };
};
