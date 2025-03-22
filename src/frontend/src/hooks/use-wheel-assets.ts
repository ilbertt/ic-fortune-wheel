'use client';

import { useAuth } from '@/contexts/auth-context';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import {
  isWheelAssetDisabled,
  isWheelAssetToken,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { extractOk } from '@/lib/api';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

type WheelAssetsData = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  tokenAssets: WheelAssetToken[];
  enabled: WheelAsset[];
  disabled: WheelAsset[];
};

// Default values if data is not loaded yet
const DEFAULT_WHEEL_ASSETS_DATA: WheelAssetsData = {
  assets: {},
  tokenAssets: [],
  enabled: [],
  disabled: [],
};

// keep it out of the component to maintain a stable reference
const selectWheelAssets = (data: Array<WheelAsset>): WheelAssetsData => {
  return data.reduce(
    (acc, asset) => {
      acc.assets[asset.id] = asset;
      if (isWheelAssetDisabled(asset)) {
        acc.disabled.push(asset);
      } else {
        acc.enabled.push(asset);
      }
      if (isWheelAssetToken(asset)) {
        acc.tokenAssets.push(asset);
      }
      return acc;
    },
    {
      assets: {} as Record<WheelAsset['id'], WheelAsset>,
      tokenAssets: [] as WheelAssetToken[],
      enabled: [] as WheelAsset[],
      disabled: [] as WheelAsset[],
    },
  );
};

type UseWheelAssetsReturnType = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  tokenAssets: WheelAssetToken[];
  enabledAssets: WheelAsset[];
  disabledAssets: WheelAsset[];
  fetchingAssets: boolean;
  getWheelAsset: (id: WheelAsset['id']) => WheelAsset | undefined;
};

export const useWheelAssets = (): UseWheelAssetsReturnType => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();

  // Query to fetch wheel assets
  const { data, isLoading: fetchingAssets } = useQuery({
    queryKey: ['wheel-assets'],
    queryFn: async () => {
      return await actor!.list_wheel_assets({ state: [] }).then(extractOk);
    },
    enabled: !!actor && isCurrentUserAdmin,
    select: selectWheelAssets,
    meta: {
      errorMessage: 'Error fetching assets',
    },
  });

  const getWheelAsset = useCallback(
    (id: WheelAsset['id']): WheelAsset | undefined => {
      return data?.assets[id];
    },
    [data],
  );

  return {
    assets: data?.assets || DEFAULT_WHEEL_ASSETS_DATA.assets,
    tokenAssets: data?.tokenAssets || DEFAULT_WHEEL_ASSETS_DATA.tokenAssets,
    enabledAssets: data?.enabled || DEFAULT_WHEEL_ASSETS_DATA.enabled,
    disabledAssets: data?.disabled || DEFAULT_WHEEL_ASSETS_DATA.disabled,
    fetchingAssets,
    getWheelAsset,
  };
};
