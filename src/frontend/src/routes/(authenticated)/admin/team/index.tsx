import { createFileRoute } from '@tanstack/react-router';
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
import type {
  UserProfile as UserProfileType,
  UserRole,
} from '@/declarations/backend/backend.did';
import type { ExtractKeysFromCandidEnum } from '@/lib/types/utils';
import { enumKey } from '@/lib/utils';
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
import { useDeleteUser } from '@/hooks/use-delete-user';
import { useUpdateUser } from '@/hooks/use-update-user';
import { useUser } from '@/hooks/use-user';

export const Route = createFileRoute('/(authenticated)/admin/team/')({
  component: RouteComponent,
});

type TeamMemberRowProps = {
  member: UserProfileType;
};

const TeamMemberRow: React.FC<TeamMemberRowProps> = ({ member }) => {
  const { user } = useUser();
  const isCurrentUser = member.id === user?.id;
  const [role, setRole] = useState<ExtractKeysFromCandidEnum<UserRole>>(
    enumKey(member.role),
  );
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();
  const { mutate: updateUser, isPending: isUpdating } = useUpdateUser();

  const handleRoleChange = useCallback(
    (value: string) => {
      const newRole = value as ExtractKeysFromCandidEnum<UserRole>;
      setRole(newRole);
      updateUser({ userId: member.id, role: newRole });
    },
    [member.id, updateUser],
  );

  return (
    <div className="flex flex-col items-start space-y-3 md:flex-row md:items-center md:justify-between md:space-x-4">
      <UserProfile user={member} showId />
      <div className="flex w-full flex-col flex-wrap gap-2 md:flex-row md:items-center md:justify-end">
        <div className="flex flex-row flex-wrap items-center gap-0.5">
          {isUpdating && <Loader className="mr-2 size-4" />}
          <Select
            value={role}
            onValueChange={handleRoleChange}
            disabled={isCurrentUser || isUpdating}
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
                <AlertDialogCancel disabled={isDeleting}>
                  Cancel
                </AlertDialogCancel>
                <Button
                  onClick={() => deleteUser(member.id)}
                  loading={isDeleting}
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

function RouteComponent() {
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
