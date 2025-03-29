import { AssetTypeBadge } from '@/components/asset-type-badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import { renderUsdValue } from '@/lib/utils';
import { isWheelAssetDisabled, isWheelAssetTypeToken } from '@/lib/wheel-asset';
import { createColumnHelper } from '@tanstack/react-table';
import { MinusCircle, PlusCircle } from 'lucide-react';
import { useMemo } from 'react';
import { EditAssetModal } from './modals/edit';
import { Loader } from '@/components/loader';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';

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
      className="[&>svg]:!size-6"
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
        cell: ctx => {
          const assetType = ctx.getValue();
          if (isWheelAssetTypeToken(assetType)) {
            return assetType.token.available_draws_count;
          }
          return 'N/A';
        },
      }),
      columnHelper.accessor(row => row.asset_type, {
        id: 'prizeValue',
        header: 'Prize Value',
        cell: ctx => {
          const assetType = ctx.getValue();
          if (isWheelAssetTypeToken(assetType)) {
            return renderUsdValue(assetType.token.prize_usd_amount);
          }
          return 'N/A';
        },
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
