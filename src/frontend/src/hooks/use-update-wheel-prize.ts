'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WheelAssetUiSettings,
  WheelAssetState,
  UpdateWheelAssetTypeConfig,
} from '@/declarations/backend/backend.did';
import { toastError } from '@/lib/utils';

type UpdateWheelPrizeParams = {
  id: string;
  wheel_ui_settings?: WheelAssetUiSettings;
  name?: string;
  total_amount?: number;
  used_amount?: number;
  state?: WheelAssetState;
  asset_type_config?: UpdateWheelAssetTypeConfig;
};

export const useUpdateWheelPrize = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateWheelPrizeParams) => {
      return actor!
        .update_wheel_asset({
          id: params.id,
          wheel_ui_settings: params.wheel_ui_settings
            ? [params.wheel_ui_settings]
            : [],
          name: params.name ? [params.name] : [],
          total_amount: params.total_amount ? [params.total_amount] : [],
          used_amount: params.used_amount ? [params.used_amount] : [],
          state: params.state ? [params.state] : [],
          asset_type_config: params.asset_type_config
            ? [params.asset_type_config]
            : [],
        })
        .then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-prizes'] });
    },
    onError: err => toastError(err, 'Error updating prize settings'),
  });
};
