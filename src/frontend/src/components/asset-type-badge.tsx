import type { WheelAssetType } from '@/declarations/backend/backend.did';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { enumKey } from '@/lib/utils';
import { capitalCase } from 'change-case';
import {
  isWheelAssetTypeGadget,
  isWheelAssetTypeJackpot,
  isWheelAssetTypeToken,
} from '@/lib/wheel-asset';
import {
  AssetGadgetIcon,
  AssetJackpotIcon,
  AssetTokenIcon,
} from '@/icons/asset-type';

type AssetTypeBadgeProps = BadgeProps & {
  assetType: WheelAssetType;
};

export const AssetTypeBadge: React.FC<AssetTypeBadgeProps> = ({
  assetType,
  ...props
}) => {
  return (
    <Badge {...props}>
      {isWheelAssetTypeToken(assetType) && <AssetTokenIcon />}
      {isWheelAssetTypeGadget(assetType) && <AssetGadgetIcon />}
      {isWheelAssetTypeJackpot(assetType) && <AssetJackpotIcon />}
      {capitalCase(enumKey(assetType))}
    </Badge>
  );
};
