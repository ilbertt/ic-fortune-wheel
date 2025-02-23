'use client';

import { DataTable } from '@/components/ui/data-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { PrincipalDisplay } from '@/components/principal-display';
import { UserProfile } from '@/components/user-profile';
import type { WheelPrizeExtraction } from '@/declarations/backend/backend.did';
import { WheelPrizeExtractionStateBadge } from '@/components/wheel-prize-extraction-state-badge';
import { renderDatetime } from '@/lib/utils';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useActivity } from '@/hooks/use-activity';

const columnHelper = createColumnHelper<WheelPrizeExtraction>();

export const ActivityTable: React.FC = () => {
  const { data: activity } = useActivity();
  const { getTeamMember } = useTeamMembers();

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
        cell: () => 'Wheel Prize Extraction',
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
    [getTeamMember],
  );

  return <DataTable columns={columns} data={activity || []} />;
};
