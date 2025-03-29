import type { WheelAssetType } from '@/declarations/backend/backend.did';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { enumKey } from '@/lib/utils';
import { capitalCase } from 'change-case';

type AssetTypeBadgeProps = BadgeProps & {
  assetType: WheelAssetType;
};

export const AssetTypeBadge: React.FC<AssetTypeBadgeProps> = ({
  assetType,
  ...props
}) => {
  return <Badge {...props}>{capitalCase(enumKey(assetType))}</Badge>;
};
