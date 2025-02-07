import type {
  WheelAsset,
  WheelAssetState,
  WheelAssetType,
} from '@/declarations/backend/backend.did';
import { enumKey, fileFromUrl } from '@/lib/utils';
import { backendBaseUrl } from '@/lib/api';

export type WheelAssetToken = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { token: unknown }>;
};
export type WheelAssetGadget = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { gadget: unknown }>;
};

export const isWheelAssetTypeToken = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { token: unknown }> => {
  return 'token' in assetType;
};

export const isWheelAssetToken = (
  asset: WheelAsset,
): asset is WheelAssetToken => {
  return isWheelAssetTypeToken(asset.asset_type);
};

export const isWheelAssetGadget = (
  asset: WheelAsset,
): asset is WheelAssetGadget => {
  return 'gadget' in asset.asset_type;
};

export const wheelAssetBalance = (asset: WheelAssetToken): number => {
  const balance = asset.asset_type.token.balance[0];
  if (!balance) {
    return 0;
  }
  // we can reasonably assume the balance won't overflow the Number type
  const balanceNumber = Number(balance.balance);
  return balanceNumber / 10 ** asset.asset_type.token.ledger_config.decimals;
};

export const wheelAssetTokenTotalUsdValue = (
  asset: WheelAssetToken,
): number => {
  const usdPrice = asset.asset_type.token.usd_price[0];
  const balance = wheelAssetBalance(asset);

  return usdPrice ? usdPrice.usd_price * balance : 0;
};

export const wheelAssetsUsdValueSum = (assets: WheelAsset[]): number => {
  return assets.reduce(
    (acc, asset) =>
      acc +
      (isWheelAssetToken(asset) ? wheelAssetTokenTotalUsdValue(asset) : 0),
    0,
  );
};

export const isWheelAssetDisabled = (
  asset: WheelAsset,
): asset is Omit<WheelAsset, 'state'> & {
  state: Extract<WheelAssetState, { disabled: null }>;
} => {
  return enumKey(asset.state) === 'disabled';
};

export const wheelAssetUrl = (
  imagePath:
    | WheelAsset['wheel_image_path']
    | WheelAsset['modal_image_path']
    | undefined,
): string | undefined => {
  if (!imagePath) {
    return undefined;
  }
  const imgPath = imagePath[0];
  if (!imgPath) {
    return undefined;
  }

  return `${backendBaseUrl}${imgPath}`;
};

export const existingWheelAssetImagesFiles = async (
  wheelAsset: WheelAsset,
): Promise<{
  wheelImageFile: File | undefined;
  modalImageFile: File | undefined;
}> => {
  const wheelImageUrl = wheelAssetUrl(wheelAsset.wheel_image_path);
  const wheelImageFile = wheelImageUrl
    ? (await fileFromUrl(wheelImageUrl)) || undefined
    : undefined;
  const modalImageUrl = wheelAssetUrl(wheelAsset.modal_image_path);
  const modalImageFile = modalImageUrl
    ? (await fileFromUrl(modalImageUrl)) || undefined
    : undefined;
  return {
    wheelImageFile,
    modalImageFile,
  };
};
