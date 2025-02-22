'use client';

import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { USER_ROLE_OPTIONS } from '@/constants/user';
import { useAuth } from '@/contexts/auth-context';
import { useUser } from '@/contexts/user-context';
import type {
  UserProfile as UserProfileType,
  UserRole,
} from '@/declarations/backend/backend.did';
import { extractOk } from '@/lib/api';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { enumKey, toastError, toCandidEnum } from '@/lib/utils';
import { UserMinus2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Loader } from '@/components/loader';
import { useTeamMembers } from '@/hooks/use-team-members';
import { UserProfile } from '@/components/user-profile';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type TeamMemberRowProps = {
  member: UserProfileType;
};

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member }) => {
  const { user } = useUser();
  const { actor } = useAuth();
  const queryClient = useQueryClient();
  const isCurrentUser = member.id === user?.id;
  const [role, setRole] = useState<ExtractKeysFromCandidEnum<UserRole>>(
    enumKey(member.role),
  );

  const deleteUserMutation = useMutation({
    mutationFn: async () => {
      const result = await actor?.delete_user_profile({ user_id: member.id });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => toastError(e, 'Error deleting user'),
  });

  const updateRoleMutation = useMutation({
    mutationFn: async (newRole: ExtractKeysFromCandidEnum<UserRole>) => {
      const result = await actor?.update_user_profile({
        user_id: member.id,
        username: [],
        role: [toCandidEnum(newRole)],
      });
      return extractOk(result);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
    },
    onError: e => {
      toastError(e, 'Error updating tole');
      // Reset role back to original on error
      setRole(enumKey(member.role));
    },
  });

  const handleRoleChange = useCallback(
    (value: string) => {
      const newRole = value as ExtractKeysFromCandidEnum<UserRole>;
      setRole(newRole);
      updateRoleMutation.mutate(newRole);
    },
    [updateRoleMutation],
  );

  return (
    <div className="flex flex-col items-start space-y-3 md:flex-row md:items-center md:justify-between md:space-x-4">
      <UserProfile user={member} showId />
      <div className="flex w-full flex-col flex-wrap gap-2 md:flex-row md:items-center md:justify-end">
        <div className="flex flex-row flex-wrap items-center gap-0.5">
          {updateRoleMutation.isPending && <Loader className="mr-2 h-4 w-4" />}
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={isCurrentUser || updateRoleMutation.isPending}
          >
            <SelectTrigger className="md:w-[180px]">
              <SelectValue placeholder="Select a role" />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLE_OPTIONS.map(({ value, label }) => (
                <SelectItem value={value} key={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {!isCurrentUser && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="secondary">
                <UserMinus2 />
                Remove
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete{' '}
                  <b>{member.username}</b> from the system.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteUserMutation.isPending}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={() => deleteUserMutation.mutate()}
                  loading={deleteUserMutation.isPending}
                >
                  <UserMinus2 />
                  Remove
                </Button>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}
      </div>
    </div>
  );
};

export default function Page() {
  const { data, isLoading } = useTeamMembers();

  return (
    <PageLayout>
      <PageHeader title="Team" />
      <PageContent>
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Team Members</CardTitle>
            <CardDescription>Manage permissions for your team</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6">
            {!isLoading ? (
              data?.teamMembersList.map(member => (
                <TeamMemberRow key={member.id} member={member} />
              ))
            ) : (
              <Loader />
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
