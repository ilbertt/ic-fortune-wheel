'use client';

import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { toastError } from '@/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  UpdateWheelAssetImageConfig,
  WheelAsset,
} from '@/declarations/backend/backend.did';

type UpsertWheelAssetImagesParams = {
  wheelAssetId: string;
  existingWheelAsset: WheelAsset | null;
  wheelImageFile?: File;
  modalImageFile?: File;
};

export const useUpsertWheelAssetImages = () => {
  const { actor } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      wheelAssetId,
      existingWheelAsset,
      wheelImageFile,
      modalImageFile,
    }: UpsertWheelAssetImagesParams) => {
      if (!actor) throw new Error('Actor not available');

      const toUpdate: UpdateWheelAssetImageConfig[] = [];
      if (
        wheelImageFile instanceof File &&
        wheelImageFile.name !==
          existingWheelAsset?.wheel_image_path[0]?.split('/').pop()
      ) {
        toUpdate.push({
          wheel: {
            content_type: wheelImageFile.type,
            content_bytes: new Uint8Array(await wheelImageFile.arrayBuffer()),
          },
        });
      }
      if (
        modalImageFile instanceof File &&
        modalImageFile.name !==
          existingWheelAsset?.modal_image_path[0]?.split('/').pop()
      ) {
        toUpdate.push({
          modal: {
            content_type: modalImageFile.type,
            content_bytes: new Uint8Array(await modalImageFile.arrayBuffer()),
          },
        });
      }

      return Promise.all(
        toUpdate.map(config =>
          actor
            .update_wheel_asset_image({
              id: wheelAssetId,
              image_config: config,
            })
            .then(extractOk),
        ),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wheel-assets'] });
    },
    onError: err => toastError(err, 'Error updating wheel asset images'),
  });
};
