import { useAuth } from '@/hooks/use-auth';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import {
  isWheelAssetDisabled,
  isWheelAssetToken,
  sortWheelAssetTokensByTotalUsdValue,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { extractOk } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

type WheelAssetsData = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  tokenAssets: WheelAssetToken[];
  enabledAssets: WheelAsset[];
  disabledAssets: WheelAsset[];
};

// Default values if data is not loaded yet
const DEFAULT_WHEEL_ASSETS_DATA = {
  assets: {},
  tokenAssets: [],
  enabledAssets: [],
  disabledAssets: [],
} satisfies WheelAssetsData;

// keep it out of the component to maintain a stable reference
const selectWheelAssets = (data: Array<WheelAsset>): WheelAssetsData => {
  const wheelAssets = data.reduce(
    (acc, asset) => {
      acc.assets[asset.id] = asset;
      if (isWheelAssetDisabled(asset)) {
        acc.disabledAssets.push(asset);
      } else {
        acc.enabledAssets.push(asset);
      }
      if (isWheelAssetToken(asset)) {
        acc.tokenAssets.push(asset);
      }
      return acc;
    },
    {
      assets: {} as Record<WheelAsset['id'], WheelAsset>,
      tokenAssets: [] as WheelAssetToken[],
      enabledAssets: [] as WheelAsset[],
      disabledAssets: [] as WheelAsset[],
    },
  );
  wheelAssets.tokenAssets.sort(sortWheelAssetTokensByTotalUsdValue);
  return wheelAssets;
};

type UseWheelAssetsReturnType = WheelAssetsData & {
  fetchingAssets: boolean;
  getWheelAsset: (id: WheelAsset['id']) => WheelAsset | undefined;
};

export const useWheelAssets = (): UseWheelAssetsReturnType => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();

  // Query to fetch wheel assets with proper typing and transformation
  const { data, isLoading: fetchingAssets } = useQuery({
    queryKey: ['wheel-assets'],
    queryFn: async () => {
      const response = await actor!.list_wheel_assets({ state: [] });
      const rawData = extractOk(response);
      return selectWheelAssets(rawData);
    },
    enabled: !!actor && isCurrentUserAdmin,
    meta: {
      errorMessage: 'Error fetching assets',
    },
  });

  return useMemo(
    () => ({
      ...(data || DEFAULT_WHEEL_ASSETS_DATA),
      fetchingAssets,
      getWheelAsset: (id): WheelAsset | undefined => {
        return data?.assets[id];
      },
    }),
    [data, fetchingAssets],
  );
};
