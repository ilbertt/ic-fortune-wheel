import { type WheelPrize } from '@/declarations/backend/backend.did';
import { type WheelDataType } from 'react-custom-roulette';
import { wheelAssetUrl } from '@/lib/wheel-asset';

/**
 * Maps prizes from the backend to data usable by `react-custom-roulette`'s `Wheel` component.
 */
export const mapPrizesToWheelData = <T extends WheelPrize>(
  prizes: T[],
): WheelDataType[] => {
  return prizes.map(item => {
    const imageUri = wheelAssetUrl(item.wheel_image_path);

    return {
      option: item.name,
      image: imageUri
        ? {
            uri: imageUri,
            sizeMultiplier: 0.8,
            offsetY: 180,
          }
        : undefined,
      style: {
        backgroundColor: item.wheel_ui_settings.background_color_hex,
      },
    };
  });
};

export const cacheWheelModalImage = async (wheelAsset: WheelPrize) => {
  const modalImageUrl = wheelAssetUrl(wheelAsset.modal_image_path);
  if (modalImageUrl) {
    // All wheel images should have `Cache-Control` set to 1 week,
    // so we can just pre-fetch them to avoid flickering when they're loaded.
    await fetch(modalImageUrl, {
      method: 'GET',
    });
  }
};
