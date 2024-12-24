import type {
  WheelAsset,
  WheelAssetType,
} from '@/declarations/backend/backend.did';

export type WheelAssetToken = Omit<WheelAsset, 'asset_type'> & {
  asset_type: Extract<WheelAssetType, { token: unknown }>;
};

export const isWheelAssetToken = (
  asset: WheelAsset,
): asset is WheelAssetToken => {
  return 'token' in asset.asset_type;
};

export const wheelAssetTokenTotalUsdValue = (
  asset: WheelAssetToken,
): number => {
  const usdPrice = asset.asset_type.token.usd_price[0];

  return usdPrice ? usdPrice.usd_price * asset.total_amount : 0;
};

export const wheelAssetsUsdValueSum = (assets: WheelAsset[]): number => {
  return assets.reduce(
    (acc, asset) =>
      acc +
      (isWheelAssetToken(asset) ? wheelAssetTokenTotalUsdValue(asset) : 0),
    0,
  );
};
