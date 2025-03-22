import type {
  WheelAsset,
  WheelAssetState,
  WheelAssetType,
} from '@/declarations/backend/backend.did';
import { bigIntToFloat, enumKey, fileFromUrl } from '@/lib/utils';
import { backendBaseUrl } from '@/lib/api';

export type WheelAssetToken = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { token: unknown }>;
};
export type WheelAssetGadget = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { gadget: unknown }>;
};
export type WheelAssetJackpot = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { jackpot: unknown }>;
};

export type WheelAssetTypeJackpot = Extract<
  WheelAssetType,
  { jackpot: unknown }
>;

export const isWheelAssetTypeToken = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { token: unknown }> => {
  return 'token' in assetType;
};

export const isWheelAssetTypeGadget = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { gadget: unknown }> => {
  return 'gadget' in assetType;
};

export const isWheelAssetTypeJackpot = (
  assetType: WheelAssetType,
): assetType is Extract<WheelAssetType, { jackpot: unknown }> => {
  return 'jackpot' in assetType;
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
  const balance = asset.asset_type.token.balance[0]?.balance;
  if (!balance) {
    return 0;
  }
  const decimals = asset.asset_type.token.ledger_config.decimals;
  return bigIntToFloat(balance, decimals);
};

export const wheelAssetTokenTotalUsdValue = (
  asset: WheelAssetToken,
): number => {
  const usdPrice = asset.asset_type.token.usd_price[0];
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
): asset is Omit<WheelAsset, 'state'> & {
  state: Extract<WheelAssetState, { enabled: null }>;
} => {
  return enumKey(asset.state) === 'enabled';
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
