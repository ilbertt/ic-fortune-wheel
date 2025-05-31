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
            sizeMultiplier: 0.5,
            offsetY: 180,
          }
        : undefined,
      style: {
        backgroundColor: item.wheel_ui_settings.background_color_hex,
      },
    };
  });
};
