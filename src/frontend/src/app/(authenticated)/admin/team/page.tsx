'use client';

import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { UserIdDisplay } from '@/components/user-id-display';
import { USER_ROLE_OPTIONS } from '@/constants/user';
import { useAuth } from '@/contexts/auth-context';
import { useUser } from '@/contexts/user-context';
import type {
  Err,
  UserProfile,
  UserRole,
} from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { userInitials } from '@/lib/user';
import { enumKey, renderError, toCandidEnum } from '@/lib/utils';
import { UserMinus2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
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

type TeamMemberRowProps = {
  member: UserProfile;
  onDelete: () => Promise<void>;
};

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member, onDelete }) => {
  const { user } = useUser();
  const { actor } = useAuth();
  const [role, setRole] = useState<ExtractKeysFromCandidEnum<UserRole>>(
    enumKey(member.role),
  );
  const [isUpdateLoading, setIsUpdateLoading] = useState(false);
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const { toast } = useToast();
  const isCurrentUser = member.id === user?.id;

  const handleRoleChange = useCallback(
    (value: string) => {
      const oldRole = enumKey(member.role);
      const newRole = value as ExtractKeysFromCandidEnum<UserRole>;
      setRole(newRole);
      setIsUpdateLoading(true);
      actor
        ?.update_user_profile({
          user_id: member.id,
          username: [],
          role: [toCandidEnum(newRole)],
        })
        .then(extractOk)
        .catch((e: Err) => {
          setRole(oldRole);
          toast({
            title: 'Error updating role',
            description: renderError(e),
            variant: 'destructive',
          });
        })
        .finally(() => setIsUpdateLoading(false));
    },
    [actor, member, toast],
  );

  const handleDeleteUser = useCallback(() => {
    setIsDeleteLoading(true);
    actor
      ?.delete_user_profile({ user_id: member.id })
      .then(extractOk)
      .then(onDelete)
      .catch((e: Err) => {
        toast({
          title: 'Error deleting user',
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setIsDeleteLoading(false));
  }, [actor, member, toast, onDelete]);

  return (
    <div className="flex flex-col items-start space-y-3 md:flex-row md:items-center md:justify-between md:space-x-4">
      <div className="flex items-center space-x-4">
        <Avatar className="h-8 w-8">
          <AvatarFallback>{userInitials(member)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none">
            {member.username}
            {isCurrentUser && ' (You)'}
          </p>
          <UserIdDisplay
            userId={member.id}
            className="[&>p]:whitespace-normal [&>p]:md:whitespace-nowrap"
          />
        </div>
      </div>
      <div className="flex w-full flex-col flex-wrap gap-2 md:flex-row md:items-center md:justify-end">
        <div className="flex flex-row flex-wrap items-center gap-0.5">
          {isUpdateLoading && <Loader className="mr-2 h-4 w-4" />}
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={isCurrentUser || isUpdateLoading}
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
                <AlertDialogCancel disabled={isDeleteLoading}>
                  Cancel
                </AlertDialogCancel>
                <Button onClick={handleDeleteUser} loading={isDeleteLoading}>
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
  const { actor } = useAuth();
  const [teamMembers, setTeamMembers] = useState<UserProfile[]>([]);
  const { toast } = useToast();

  const fetchTeamMembers = useCallback(async () => {
    await actor
      ?.list_users()
      .then(extractOk)
      .then(setTeamMembers)
      .catch((e: Err) =>
        toast({
          title: 'Error fetching team members',
          description: renderError(e),
          variant: 'destructive',
        }),
      );
  }, [actor, toast]);

  useEffect(() => {
    fetchTeamMembers();
  }, [fetchTeamMembers]);

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
            {teamMembers.length > 0 ? (
              teamMembers.map(member => (
                <TeamMemberRow
                  key={member.id}
                  member={member}
                  onDelete={fetchTeamMembers}
                />
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
