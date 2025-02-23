import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import {
  isWheelAssetDisabled,
  isWheelAssetToken,
  wheelAssetTokenTotalUsdValue,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { useUser } from '@/contexts/user-context';

type WheelContextType = {
  assets: Record<WheelAsset['id'], WheelAsset>;
  enabledAssets: WheelAsset[];
  disabledAssets: WheelAsset[];
  tokenAssets: WheelAssetToken[];
  fetchingAssets: boolean;
  fetchAssets: () => Promise<void>;
  refreshingTokens: boolean;
  refreshTokenAssets: () => Promise<void>;
  getWheelAsset: (id: WheelAsset['id']) => WheelAsset | undefined;
};

const WheelAssetsContext = createContext<WheelContextType>({
  assets: {},
  enabledAssets: [],
  disabledAssets: [],
  tokenAssets: [],
  fetchingAssets: false,
  fetchAssets: async () => {},
  refreshingTokens: false,
  refreshTokenAssets: async () => {},
  getWheelAsset: () => undefined,
});

type WheelAssetsProviderProps = {
  refreshIntervalMs: number;
  children: React.ReactNode;
};

export const WheelAssetsProvider = ({
  refreshIntervalMs,
  children,
}: WheelAssetsProviderProps) => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [refreshingTokens, setRefreshingTokens] = useState(false);
  const [assets, setAssets] = useState<{
    assets: Record<WheelAsset['id'], WheelAsset>;
    enabled: WheelAsset[];
    disabled: WheelAsset[];
  }>({ assets: {}, enabled: [], disabled: [] });
  const [tokenAssets, setTokenAssets] = useState<WheelAssetToken[]>([]);
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    if (!isCurrentUserAdmin) {
      return;
    }
    return actor
      ?.list_wheel_assets({ state: [] })
      .then(extractOk)
      .then(res => {
        const newAssets = res.reduce(
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
        setAssets(newAssets);
        const tokenAssetsArr = res
          .filter(isWheelAssetToken)
          .sort((a, b) =>
            wheelAssetTokenTotalUsdValue(a) > wheelAssetTokenTotalUsdValue(b)
              ? -1
              : 1,
          );
        setTokenAssets(tokenAssetsArr);
      })
      .catch((e: Err) => {
        const title = 'Error fetching assets';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      });
  }, [actor, toast, isCurrentUserAdmin]);

  const refreshTokenAssets = useCallback(() => {
    setRefreshingTokens(true);
    return (
      actor
        .fetch_tokens_data()
        .then(extractOk)
        // wait for the backend to update the tokens
        .then(() => new Promise(resolve => setTimeout(resolve, 10_000)))
        .then(fetchAssets)
        .catch((e: Err) => {
          const title = 'Error refreshing tokens';
          console.error(title, e);
          toast({
            title,
            description: renderError(e),
            variant: 'destructive',
          });
        })
        .finally(() => setRefreshingTokens(false))
    );
  }, [actor, toast, fetchAssets]);

  useEffect(() => {
    if (!isCurrentUserAdmin) {
      return;
    }
    setFetchingAssets(true);
    fetchAssets().finally(() => setFetchingAssets(false));

    const intervalId = setInterval(fetchAssets, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [fetchAssets, refreshIntervalMs, isCurrentUserAdmin]);

  return (
    <WheelAssetsContext.Provider
      value={{
        assets: assets.assets,
        enabledAssets: assets.enabled,
        disabledAssets: assets.disabled,
        tokenAssets: tokenAssets,
        fetchingAssets,
        fetchAssets,
        refreshingTokens,
        refreshTokenAssets,
        getWheelAsset: (id: WheelAsset['id']) => assets.assets[id],
      }}
    >
      {children}
    </WheelAssetsContext.Provider>
  );
};

export const useWheelAssets = (): WheelContextType =>
  useContext(WheelAssetsContext);
