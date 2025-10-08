import {
  type WheelAsset,
  WheelAssetState,
  type WheelAssetType,
} from '@/lib/api/backend/backend';
import { bigIntToFloat, fileFromUrl } from '@/lib/utils';
import { canisterId } from '@/lib/api';

export type WheelAssetToken = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { __kind__: 'token' }>;
};
export type WheelAssetGadget = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { __kind__: 'gadget' }>;
};
export type WheelAssetJackpot = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { __kind__: 'jackpot' }>;
};
export type WheelAssetEnabled = Omit<WheelAsset, 'state'> & {
  state: WheelAssetState.enabled;
};
export type WheelAssetDisabled = Omit<WheelAsset, 'state'> & {
  state: WheelAssetState.disabled;
};

export type WheelAssetTypeJackpot = Extract<
  WheelAssetType,
  { __kind__: 'jackpot' }
>;

export const isWheelAssetTypeToken = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { __kind__: 'token' }> => {
  return assetType.__kind__ === 'token';
};

export const isWheelAssetTypeGadget = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { __kind__: 'gadget' }> => {
  return assetType.__kind__ === 'gadget';
};

export const isWheelAssetTypeJackpot = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { __kind__: 'jackpot' }> => {
  return assetType.__kind__ === 'jackpot';
};

export const isWheelAssetToken = (
  asset: WheelAsset,
): asset is WheelAssetToken => {
  return isWheelAssetTypeToken(asset.asset_type);
};

export const isWheelAssetGadget = (
  asset: WheelAsset,
): asset is WheelAssetGadget => {
  return isWheelAssetTypeGadget(asset.asset_type);
};

export const isWheelAssetJackpot = (
  asset: WheelAsset,
): asset is WheelAssetJackpot => {
  return isWheelAssetTypeJackpot(asset.asset_type);
};

export const wheelAssetBalance = (asset: WheelAssetToken): number => {
  const balance = asset.asset_type.token.balance?.balance;
  if (!balance) {
    return 0;
  }
  const decimals = asset.asset_type.token.ledger_config.decimals;
  return bigIntToFloat(balance, decimals);
};

export const wheelAssetTokenTotalUsdValue = (
  asset: WheelAssetToken,
): number => {
  const usdPrice = asset.asset_type.token.usd_price;
  const balance = wheelAssetBalance(asset);

  return usdPrice ? usdPrice.usd_price * balance : 0;
};

export const wheelAssetTokensPrizeUsdSum = (
  assets: WheelAssetToken[],
): number => {
  return assets.reduce(
    (acc, asset) => acc + asset.asset_type.token.prize_usd_amount,
    0,
  );
};

export const wheelAssetJackpotAvailableDrawsCount = (
  assets: WheelAssetToken[],
): number => {
  return Math.min(
    ...assets.map(asset => asset.asset_type.token.available_draws_count),
  );
};

export const wheelAssetsUsdValueSum = (assets: WheelAsset[]): number => {
  return assets.reduce(
    (acc, asset) =>
      acc +
      (isWheelAssetToken(asset) ? wheelAssetTokenTotalUsdValue(asset) : 0),
    0,
  );
};

export const isWheelAssetEnabled = (
  asset: WheelAsset,
): asset is WheelAssetEnabled => {
  return asset.state === WheelAssetState.enabled;
};

export const isWheelAssetDisabled = (
  asset: WheelAsset,
): asset is WheelAssetDisabled => {
  return asset.state === WheelAssetState.disabled;
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
  if (import.meta.env.DEV) {
    imagePath = `http://${canisterId}.localhost:4943${imagePath}`;
  }
  return imagePath;
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

export const sortWheelAssetTokensByTotalUsdValue = (
  a: WheelAssetToken,
  b: WheelAssetToken,
): number => {
  return wheelAssetTokenTotalUsdValue(b) - wheelAssetTokenTotalUsdValue(a);
};
