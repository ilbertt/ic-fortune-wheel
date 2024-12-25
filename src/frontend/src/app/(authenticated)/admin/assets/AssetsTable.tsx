'use client';

import { AssetTypeBadge } from '@/components/asset-type-badge';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { useAuth } from '@/contexts/auth-context';
import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError, renderUsdValue, toCandidEnum } from '@/lib/utils';
import { isWheelAssetDisabled } from '@/lib/wheelAsset';
import { createColumnHelper } from '@tanstack/react-table';
import { Loader2, MinusCircle, PlusCircle } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

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
  onToggleEnabledComplete: () => Promise<void>;
};

export const AssetsTable: React.FC<AssetsTableProps> = ({
  data,
  onToggleEnabledComplete,
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
      columnHelper.accessor('used_amount', {
        header: 'Draws',
      }),
      columnHelper.accessor('asset_type', {
        header: 'Prize Value',
        cell: ctx => {
          const assetType = ctx.getValue();
          if ('token' in assetType) {
            return renderUsdValue(assetType.token.prize_usd_amount);
          }
          return '-';
        },
      }),
      columnHelper.display({
        id: '__toggleEnabled',
        cell: ctx => (
          <AssetStateToggle
            asset={ctx.row.original}
            onToggleEnabledComplete={onToggleEnabledComplete}
          />
        ),
      }),
    ];
  }, [onToggleEnabledComplete]);

  return <DataTable columns={columns} data={data} />;
};
