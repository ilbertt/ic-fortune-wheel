'use client';

import { useQuery, UseQueryResult } from '@tanstack/react-query';
import type {
  Err,
  WheelPrizeExtraction,
} from '@/declarations/backend/backend.did';
import { useAuth } from '@/contexts/auth-context';
import { extractOk } from '@/lib/api';
import { useTeamMembers } from '@/hooks/use-team-members';
import { useUser } from '@/hooks/use-user';

const FETCH_ACTIVITY_INTERVAL_MS = 2_000;

type ActivityData = WheelPrizeExtraction[];

export function useActivity(): UseQueryResult<ActivityData, Err> {
  const { actor } = useAuth();
  const { isCurrentUserAdmin } = useUser();
  const { data: teamMembersData } = useTeamMembers();

  return useQuery<ActivityData, Err>({
    queryKey: ['activity'],
    queryFn: async () => {
      const extractions = await actor!
        .list_wheel_prize_extractions()
        .then(extractOk);

      return extractions.map(extraction => ({
        ...extraction,
        extractedBy:
          teamMembersData?.teamMembers[extraction.extracted_by_user_id],
      }));
    },
    enabled:
      !!actor &&
      isCurrentUserAdmin &&
      (teamMembersData?.teamMembersList.length || 0) > 0,
    meta: {
      errorMessage: 'Error fetching activity',
    },
    refetchInterval: FETCH_ACTIVITY_INTERVAL_MS,
  });
}
