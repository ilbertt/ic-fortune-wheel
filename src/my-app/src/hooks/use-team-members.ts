import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import type { UserProfile, Err } from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import { useCallback } from 'react';

type TeamMembersData = {
  teamMembers: Record<string, UserProfile>;
  teamMembersList: UserProfile[];
};

type UseTeamMembersReturnType = UseQueryResult<TeamMembersData, Err> & {
  getTeamMember: (id: string) => UserProfile | undefined;
};

export function useTeamMembers(): UseTeamMembersReturnType {
  const { actor } = useAuth();

  const query = useQuery<TeamMembersData, Err>({
    queryKey: ['team-members'],
    queryFn: async () => {
      const members = await actor!.list_users().then(extractOk);
      if (!members) {
        return { teamMembers: {}, teamMembersList: [] };
      }

      const membersMap = members.reduce(
        (acc, member) => {
          acc[member.id] = member;
          return acc;
        },
        {} as Record<string, UserProfile>,
      );

      return {
        teamMembers: membersMap,
        teamMembersList: members,
      };
    },
    enabled: !!actor,
    meta: {
      errorMessage: 'Error fetching team members',
    },
  });

  const getTeamMember = useCallback(
    (id: string): UserProfile | undefined => query.data?.teamMembers[id],
    [query.data],
  );

  return {
    ...query,
    getTeamMember,
  };
}
