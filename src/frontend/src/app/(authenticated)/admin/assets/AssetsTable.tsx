'use client';

import { AssetTypeBadge } from '@/components/asset-type-badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/contexts/auth-context';
import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError, renderUsdValue, toCandidEnum } from '@/lib/utils';
import { isWheelAssetDisabled, isWheelAssetTypeToken } from '@/lib/wheel-asset';
import { createColumnHelper } from '@tanstack/react-table';
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { EditAssetModal } from './modals';

type AssetStateToggleProps = {
  asset: WheelAsset;
  onToggleEnabledComplete: () => Promise<void>;
};

const AssetStateToggle: React.FC<AssetStateToggleProps> = ({
  asset,
  onToggleEnabledComplete,
}) => {
  const { actor } = useAuth();
  const isDisabled = isWheelAssetDisabled(asset);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const handleToggle = useCallback(() => {
    setIsLoading(true);
    actor
      .update_wheel_asset({
        id: asset.id,
        state: [
          isDisabled ? toCandidEnum('enabled') : toCandidEnum('disabled'),
        ],
        name: [],
        total_amount: [],
        used_amount: [],
        asset_type_config: [],
      })
      .then(extractOk)
      .then(onToggleEnabledComplete)
      .catch((e: Err) =>
        toast({
          title: 'Error toggling asset state',
          description: renderError(e),
          variant: 'destructive',
        }),
      )
      .finally(() => setIsLoading(false));
  }, [actor, isDisabled, onToggleEnabledComplete, toast, asset]);

  return (
    <Button
      className="[&>svg]:!size-6"
      variant="ghost"
      size="icon"
      onClick={handleToggle}
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
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
  fetchAssets: () => Promise<void>;
};

export const AssetsTable: React.FC<AssetsTableProps> = ({
  data,
  fetchAssets,
}) => {
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
          return '-';
        },
      }),
      columnHelper.display({
        id: '__actions',
        cell: ctx => (
          <div className="flex items-center justify-end gap-2">
            <EditAssetModal
              asset={ctx.row.original}
              onEditComplete={fetchAssets}
            />
            <AssetStateToggle
              asset={ctx.row.original}
              onToggleEnabledComplete={fetchAssets}
            />
          </div>
        ),
      }),
    ];
  }, [fetchAssets]);

  return <DataTable columns={columns} data={data} />;
};
