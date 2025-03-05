'use client';

import { useAuth } from '@/contexts/auth-context';
import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import { isWheelAssetDisabled } from '@/lib/wheel-asset';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useUser } from '@/hooks/use-user';
import { useQuery } from '@tanstack/react-query';
import { useCallback } from 'react';

// Match the previous interval used in admin layout
const FETCH_WHEEL_ASSETS_INTERVAL_MS = 30_000;

type WheelAssetsData = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  enabled: WheelAsset[];
  disabled: WheelAsset[];
};

type UseWheelAssetsReturnType = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  enabledAssets: WheelAsset[];
  disabledAssets: WheelAsset[];
  fetchingAssets: boolean;
  fetchAssets: () => Promise<void>;
  getWheelAsset: (id: WheelAsset['id']) => WheelAsset | undefined;
};

export const useWheelAssets = (): UseWheelAssetsReturnType => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();
  const { toast } = useToast();

  // Query to fetch wheel assets
  const {
    data,
    refetch,
    isLoading: fetchingAssets,
  } = useQuery<WheelAssetsData, Err>({
    queryKey: ['wheel-assets'],
    queryFn: async () => {
      const res = await actor!.list_wheel_assets({ state: [] }).then(extractOk);

      const result = res.reduce(
        (acc, asset) => {
          acc.assets[asset.id] = asset;
          if (isWheelAssetDisabled(asset)) {
            acc.disabled.push(asset);
          } else {
            acc.enabled.push(asset);
          }
          return acc;
        },
        {
          assets: {} as Record<WheelAsset['id'], WheelAsset>,
          enabled: [] as WheelAsset[],
          disabled: [] as WheelAsset[],
        },
      );

      return result;
    },
    enabled: !!actor && isCurrentUserAdmin,
    refetchInterval: FETCH_WHEEL_ASSETS_INTERVAL_MS,
    meta: {
      errorMessage: 'Error fetching assets',
    },
  });

  const fetchAssets = useCallback(async (): Promise<void> => {
    if (!isCurrentUserAdmin) {
      return Promise.resolve();
    }
    try {
      await refetch();
    } catch (e) {
      const title = 'Error fetching assets';
      console.error(title, e);
      toast({
        title,
        description: renderError(e as Err),
        variant: 'destructive',
      });
    }
  }, [refetch, isCurrentUserAdmin, toast]);

  const getWheelAsset = useCallback(
    (id: WheelAsset['id']): WheelAsset | undefined => {
      return data?.assets[id];
    },
    [data],
  );

  // Default values if data is not loaded yet
  const defaultData: WheelAssetsData = {
    assets: {},
    enabled: [],
    disabled: [],
  };

  return {
    assets: data?.assets || defaultData.assets,
    enabledAssets: data?.enabled || defaultData.enabled,
    disabledAssets: data?.disabled || defaultData.disabled,
    fetchingAssets,
    fetchAssets,
    getWheelAsset,
  };
};
