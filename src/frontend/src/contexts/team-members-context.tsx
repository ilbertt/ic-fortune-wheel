'use client';

import { useAuth } from '@/contexts/auth-context';
import type { Err, UserProfile } from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';

interface TeamMembersContextType {
  teamMembers: Record<string, UserProfile>;
  teamMembersList: UserProfile[];
  fetchingTeamMembers: boolean;
  fetchTeamMembers: () => Promise<void>;
  getTeamMember: (id: string) => UserProfile | undefined;
}

const TeamMembersContext = createContext<TeamMembersContextType>({
  teamMembers: {},
  teamMembersList: [],
  fetchingTeamMembers: false,
  fetchTeamMembers: () => Promise.reject(),
  getTeamMember: () => undefined,
});

export function TeamMembersProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { actor } = useAuth();
  const [teamMembers, setTeamMembers] = useState<Record<string, UserProfile>>(
    {},
  );
  const [teamMembersList, setTeamMembersList] = useState<UserProfile[]>([]);
  const [fetchingTeamMembers, setFetchingTeamMembers] = useState(true);
  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    setFetchingTeamMembers(true);
    await actor
      ?.list_users()
      .then(extractOk)
      .then(members => {
        setTeamMembersList(members);
        const membersMap = members.reduce(
          (acc, member) => {
            acc[member.id] = member;
            return acc;
          },
          {} as Record<string, UserProfile>,
        );
        setTeamMembers(membersMap);
      })
      .catch((e: Err) => {
        const title = 'Error fetching team members';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setFetchingTeamMembers(false));
  }, [actor, toast]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

  const getTeamMember = (id: string) => teamMembers[id];

  return (
    <TeamMembersContext.Provider
      value={{
        teamMembers,
        teamMembersList,
        fetchingTeamMembers,
        fetchTeamMembers,
        getTeamMember,
      }}
    >
      {children}
    </TeamMembersContext.Provider>
  );
}

export const useTeamMembers = () => useContext(TeamMembersContext);
