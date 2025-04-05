import { useAuth } from '@/hooks/use-auth';
import { type WheelAssetToken } from '@/lib/wheel-asset';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWheelAssets } from '@/hooks/use-wheel-assets';
import { useMemo } from 'react';

type UseWheelAssetTokensReturnType = {
  tokenAssets: WheelAssetToken[];
  refreshingTokens: boolean;
  refreshTokenAssets: () => Promise<void>;
};

export const useWheelAssetTokens = (): UseWheelAssetTokensReturnType => {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();
  const queryClient = useQueryClient();
  const { tokenAssets, fetchingAssets } = useWheelAssets();

  // Mutation to refresh token assets
  const refreshTokensMutation = useMutation({
    mutationFn: async () => {
      if (!isCurrentUserAdmin) {
        return;
      }
      await actor!
        .fetch_tokens_data()
        .then(extractOk)
        // wait for the backend to update the tokens
        .then(() => new Promise(resolve => setTimeout(resolve, 10_000)));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error refreshing tokens'),
  });

  return useMemo(
    () => ({
      tokenAssets,
      refreshingTokens: fetchingAssets || refreshTokensMutation.isPending,
      refreshTokenAssets: refreshTokensMutation.mutateAsync,
    }),
    [tokenAssets, fetchingAssets, refreshTokensMutation],
  );
};
