import type {
  WheelAsset,
  WheelAssetState,
  WheelAssetType,
} from '@/declarations/backend/backend.did';
import { enumKey } from '@/lib/utils';
import { backendBaseUrl } from '@/lib/api';

export type WheelAssetToken = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { token: unknown }>;
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

export const wheelAssetBalance = (asset: WheelAssetToken): number => {
  const balance = asset.asset_type.token.balance[0];
  if (!balance) {
    return 0;
  }
  // we can reasonably assume the balance won't overflow the Number type
  const balanceNumber = Number(balance.balance);
  return balanceNumber / 10 ** asset.asset_type.token.decimals;
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

export const wheelAssetUrl = (asset: WheelAsset): string | undefined => {
  const assetPath = asset.wheel_image_path[0];
  if (!assetPath) {
    return undefined;
  }

  return `${backendBaseUrl}${assetPath}`;
};
