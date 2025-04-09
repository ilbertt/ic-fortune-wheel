import {
  isWheelAssetToken,
  sortWheelAssetTokensByTotalUsdValue,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { useWheelAssets } from '@/hooks/use-wheel-assets';
import { useMemo } from 'react';
import type { WheelAsset } from '@/declarations/backend/backend.did';

type UseWheelAssetTokensReturnType = {
  tokenAssets: WheelAssetToken[];
  fetchingTokenAssets: boolean;
};

const selectWheelAssetTokens = (data: Array<WheelAsset>): WheelAssetToken[] => {
  return data
    .filter(el => isWheelAssetToken(el))
    .sort(sortWheelAssetTokensByTotalUsdValue);
};

export const useWheelAssetTokens = (): UseWheelAssetTokensReturnType => {
  const { data, fetchingAssets } = useWheelAssets(selectWheelAssetTokens);
  return useMemo(
    () => ({
      tokenAssets: data || [],
      fetchingTokenAssets: fetchingAssets,
    }),
    [data, fetchingAssets],
  );
};
