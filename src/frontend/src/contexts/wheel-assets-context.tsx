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

type WheelContextType = {
  enabledAssets: WheelAsset[];
  disabledAssets: WheelAsset[];
  tokenAssets: WheelAssetToken[];
  fetchingAssets: boolean;
  fetchAssets: () => Promise<void>;
};

const WheelAssetsContext = createContext<WheelContextType>({
  enabledAssets: [],
  disabledAssets: [],
  tokenAssets: [],
  fetchingAssets: false,
  fetchAssets: async () => {},
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
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [assets, setAssets] = useState<{
    enabled: WheelAsset[];
    disabled: WheelAsset[];
  }>({ enabled: [], disabled: [] });
  const [tokenAssets, setTokenAssets] = useState<WheelAssetToken[]>([]);
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    return actor
      ?.list_wheel_assets({ state: [] })
      .then(extractOk)
      .then(res => {
        const newAssets = res.reduce(
          (acc, asset) => {
            if (isWheelAssetDisabled(asset)) {
              acc.disabled.push(asset);
            } else {
              acc.enabled.push(asset);
            }
            return acc;
          },
          { enabled: [] as WheelAsset[], disabled: [] as WheelAsset[] },
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
  }, [actor, toast]);

  useEffect(() => {
    setFetchingAssets(true);
    fetchAssets().finally(() => setFetchingAssets(false));

    const intervalId = setInterval(fetchAssets, refreshIntervalMs);
    return () => clearInterval(intervalId);
  }, [fetchAssets, refreshIntervalMs]);

  return (
    <WheelAssetsContext.Provider
      value={{
        enabledAssets: assets.enabled,
        disabledAssets: assets.disabled,
        tokenAssets: tokenAssets,
        fetchingAssets,
        fetchAssets,
      }}
    >
      {children}
    </WheelAssetsContext.Provider>
  );
};

export const useWheelAssets = (): WheelContextType =>
  useContext(WheelAssetsContext);
