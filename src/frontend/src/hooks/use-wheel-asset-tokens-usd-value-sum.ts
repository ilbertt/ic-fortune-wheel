import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { wheelAssetsUsdValueSum } from '@/lib/wheel-asset';
import { useMemo } from 'react';

type UseWheelAssetTokensUsdValueSumReturnType = {
  usdValueSum: number;
};

export const useWheelAssetTokensUsdValueSum =
  (): UseWheelAssetTokensUsdValueSumReturnType => {
    const { tokenAssets } = useWheelAssetTokens();
    const usdValueSum = useMemo(() => {
      return wheelAssetsUsdValueSum(tokenAssets);
    }, [tokenAssets]);
    return { usdValueSum };
  };
