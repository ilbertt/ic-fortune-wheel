'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { candidOpt, toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  CreateWheelAssetTypeConfig,
  WheelAssetUiSettings,
} from '@/declarations/backend/backend.did';

type CreateWheelAssetParams = {
  name: string;
  total_amount: number;
  asset_type_config: CreateWheelAssetTypeConfig;
  wheel_ui_settings?: WheelAssetUiSettings;
};

export const useCreateWheelAsset = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: CreateWheelAssetParams) => {
      return actor!
        .create_wheel_asset({
          name: params.name,
          total_amount: params.total_amount,
          asset_type_config: params.asset_type_config,
          wheel_ui_settings: candidOpt(params.wheel_ui_settings),
        })
        .then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error creating wheel asset'),
  });
};
