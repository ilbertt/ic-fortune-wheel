import { AssetTypeBadge } from '@/components/asset-type-badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type {
  WheelAsset,
  WheelAssetType,
} from '@/declarations/backend/backend.did';
import { renderUsdValue } from '@/lib/utils';
import {
  isWheelAssetDisabled,
  isWheelAssetTypeJackpot,
  isWheelAssetTypeToken,
  wheelAssetJackpotAvailableDrawsCount,
  wheelAssetTokensPrizeUsdSum,
  type WheelAssetToken,
  type WheelAssetTypeJackpot,
} from '@/lib/wheel-asset';
import { createColumnHelper } from '@tanstack/react-table';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { useMemo } from 'react';
import { EditAssetModal } from './modals/edit';
import { Loader } from '@/components/loader';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';

const jackpotTokenAssets = (
  tokenAssets: WheelAssetToken[],
  assetType: WheelAssetTypeJackpot,
): WheelAssetToken[] =>
  tokenAssets.filter(wheelAsset =>
    assetType.jackpot.wheel_asset_ids.includes(wheelAsset.id),
  );

type AssetStateToggleProps = {
  asset: WheelAsset;
};

const AssetStateToggle: React.FC<AssetStateToggleProps> = ({ asset }) => {
  const isDisabled = isWheelAssetDisabled(asset);
  const updateWheelAsset = useUpdateWheelAsset();

  const handleToggle = () => {
    updateWheelAsset.mutate({
      id: asset.id,
      state: isDisabled ? 'enabled' : 'disabled',
    });
  };

  return (
    <Button
      className="[&>svg]:size-6!"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
    >
      {updateWheelAsset.isPending ? (
        <Loader />
      ) : isDisabled ? (
        <PlusCircle className="text-green-500" />
      ) : (
        <MinusCircle className="text-red-500" />
      )}
    </Button>
  );
};

type AssetsTableAvailableDrawsColumnProps = {
  assetType: WheelAssetType;
};

const AssetsTableAvailableDrawsColumn = ({
  assetType,
}: AssetsTableAvailableDrawsColumnProps) => {
  const { tokenAssets } = useWheelAssetTokens();
  if (isWheelAssetTypeToken(assetType)) {
    return assetType.token.available_draws_count.toLocaleString();
  } else if (isWheelAssetTypeJackpot(assetType)) {
    return wheelAssetJackpotAvailableDrawsCount(
      jackpotTokenAssets(tokenAssets, assetType),
    ).toLocaleString();
  }
  return 'N/A';
};

type AssetsTablePrizeValueColumnProps = {
  assetType: WheelAssetType;
};

const AssetsTablePrizeValueColumn = ({
  assetType,
}: AssetsTablePrizeValueColumnProps) => {
  const { tokenAssets } = useWheelAssetTokens();
  if (isWheelAssetTypeToken(assetType)) {
    return renderUsdValue(assetType.token.prize_usd_amount);
  } else if (isWheelAssetTypeJackpot(assetType)) {
    const totUsd = wheelAssetTokensPrizeUsdSum(
      jackpotTokenAssets(tokenAssets, assetType),
    );
    return renderUsdValue(totUsd);
  }
  return 'N/A';
};

const columnHelper = createColumnHelper<WheelAsset>();

type AssetsTableProps = {
  data: WheelAsset[];
};

export const AssetsTable: React.FC<AssetsTableProps> = ({ data }) => {
  const columns = useMemo(() => {
    return [
      columnHelper.accessor('name', {
        header: 'Name',
        cell: ctx => <div className="font-medium">{ctx.getValue()}</div>,
      }),
      columnHelper.accessor('asset_type', {
        header: 'Type',
        cell: ctx => (
          <AssetTypeBadge variant="outline" assetType={ctx.getValue()} />
        ),
      }),
      columnHelper.accessor('total_amount', {
        header: 'Prize Q.ty',
        cell: ctx => {
          const { total_amount, used_amount } = ctx.row.original;
          return (
            <>
              <span className="text-indaco-blue">
                {total_amount - used_amount}
              </span>
              /{total_amount}
            </>
          );
        },
      }),
      columnHelper.accessor(row => row.asset_type, {
        id: 'availableDraws',
        header: 'Avail. Draws',
        cell: ctx => (
          <AssetsTableAvailableDrawsColumn assetType={ctx.getValue()} />
        ),
      }),
      columnHelper.accessor(row => row.asset_type, {
        id: 'prizeValue',
        header: 'Prize Value',
        cell: ctx => <AssetsTablePrizeValueColumn assetType={ctx.getValue()} />,
      }),
      columnHelper.display({
        id: '__actions',
        cell: ctx => (
          <div className="flex items-center justify-end gap-2">
            <EditAssetModal asset={ctx.row.original} />
            <AssetStateToggle asset={ctx.row.original} />
          </div>
        ),
      }),
    ];
  }, []);

  return <DataTable columns={columns} data={data} />;
};
