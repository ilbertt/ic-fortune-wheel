'use client';

import { DataTable } from '@/components/ui/data-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { PrincipalDisplay } from '@/components/principal-display';
import { UserProfile } from '@/components/user-profile';
import type { WheelPrizeExtraction } from '@/declarations/backend/backend.did';
import { WheelPrizeExtractionStateBadge } from '@/components/wheel-prize-extraction-state-badge';
import { renderDatetime, renderUsdValue } from '@/lib/utils';
import { useWheelAssets } from '@/hooks/use-wheel-assets';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { wheelAssetUrl } from '@/lib/wheel-asset';
import Image from 'next/image';
import { isWheelPrizeExtractionCompleted } from '@/lib/wheel-prize-extraction';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useActivity } from '@/hooks/use-activity';

const columnHelper = createColumnHelper<WheelPrizeExtraction>();

export const ActivityTable: React.FC = () => {
  const { data: activity } = useActivity();
  const { getTeamMember } = useTeamMembers();
  const { getWheelAsset } = useWheelAssets();

  const columns = useMemo(
    () => [
      columnHelper.accessor('id', {
        header: 'ID',
        cell: ctx => (
          <div className="text-muted-foreground max-w-24 overflow-hidden text-ellipsis whitespace-nowrap font-medium md:max-w-fit">
            {ctx.getValue()}
          </div>
        ),
      }),
      columnHelper.display({
        header: 'Type',
        cell: ctx => {
          const wheelPrizeExtraction = ctx.row.original;
          const wheelAsset = wheelPrizeExtraction.wheel_asset_id[0]
            ? getWheelAsset(wheelPrizeExtraction.wheel_asset_id[0])
            : null;
          return (
            <div className="flex flex-row items-center gap-2">
              Wheel Prize Extraction
              {wheelAsset ? (
                <Popover>
                  <PopoverTrigger asChild>
                    {wheelAsset.wheel_image_path[0] && (
                      <Image
                        className="aspect-square max-h-6 max-w-6 cursor-pointer object-contain"
                        src={wheelAssetUrl(wheelAsset.wheel_image_path)!}
                        alt={wheelAsset.name}
                        width={50}
                        height={50}
                      />
                    )}
                  </PopoverTrigger>
                  <PopoverContent>
                    {wheelAsset.name}
                    {isWheelPrizeExtractionCompleted(
                      wheelPrizeExtraction.state,
                    ) &&
                    wheelPrizeExtraction.state.completed.prize_usd_amount[0] !==
                      undefined
                      ? ` (${renderUsdValue(
                          wheelPrizeExtraction.state.completed
                            .prize_usd_amount[0],
                        )})`
                      : null}
                  </PopoverContent>
                </Popover>
              ) : null}
            </div>
          );
        },
      }),
      columnHelper.accessor('extracted_for_principal', {
        header: 'Extracted For',
        cell: ctx => <PrincipalDisplay principal={ctx.getValue()} />,
      }),
      columnHelper.accessor('state', {
        header: 'Status',
        cell: ctx => <WheelPrizeExtractionStateBadge state={ctx.getValue()} />,
      }),
      columnHelper.accessor('updated_at', {
        header: 'Last Updated At',
        cell: ctx => renderDatetime(ctx.getValue()),
      }),
      columnHelper.accessor('extracted_by_user_id', {
        header: 'Extracted By',
        cell: ctx => {
          const extractedBy = getTeamMember(ctx.getValue());
          if (extractedBy) {
            return <UserProfile user={extractedBy} />;
          }
          return null;
        },
      }),
    ],
    [getTeamMember, getWheelAsset],
  );

  return <DataTable columns={columns} data={activity || []} />;
};
