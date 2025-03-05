'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { Err } from '@/declarations/backend/backend.did';

export const useWheelPrizeOrder = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation<unknown, Err, string[]>({
    mutationFn: async (wheelAssetIds: string[]) => {
      return actor!
        .update_wheel_prizes_order({
          wheel_asset_ids: wheelAssetIds,
        })
        .then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-prizes'] });
    },
    meta: {
      errorMessage: 'Error updating prizes order',
    },
  });
};
