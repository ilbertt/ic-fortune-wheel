import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { candidOpt, toastError, toCandidEnum } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  WheelAssetState,
  WheelAssetUiSettings,
  UpdateWheelAssetTypeConfig,
} from '@/declarations/backend/backend.did';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';

type UpdateWheelAssetParams = {
  id: string;
  state?: ExtractKeysFromCandidEnum<WheelAssetState>;
  name?: string;
  total_amount?: number;
  used_amount?: number;
  wheel_ui_settings?: WheelAssetUiSettings;
  asset_type_config?: UpdateWheelAssetTypeConfig;
};

export const useUpdateWheelAsset = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: UpdateWheelAssetParams) => {
      return actor!
        .update_wheel_asset({
          id: params.id,
          state: candidOpt(params.state ? toCandidEnum(params.state) : null),
          name: candidOpt(params.name),
          total_amount: candidOpt(params.total_amount),
          used_amount: candidOpt(params.used_amount),
          wheel_ui_settings: candidOpt(params.wheel_ui_settings),
          asset_type_config: candidOpt(params.asset_type_config),
        })
        .then(extractOk);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error updating wheel asset'),
  });
};
