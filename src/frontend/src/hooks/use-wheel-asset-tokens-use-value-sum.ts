import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { wheelAssetTokensPrizeUsdSum } from '@/lib/wheel-asset';
import { useMemo } from 'react';

type UseWheelAssetTokensUseValueSumReturnType = {
  usdValueSum: number;
};

export const useWheelAssetTokensUseValueSum =
  (): UseWheelAssetTokensUseValueSumReturnType => {
    const { tokenAssets } = useWheelAssetTokens();
    const usdValueSum = useMemo(() => {
      return wheelAssetTokensPrizeUsdSum(tokenAssets);
    }, [tokenAssets]);
    return { usdValueSum };
  };
