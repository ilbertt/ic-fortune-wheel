import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { UserIdDisplay } from '@/components/user-id-display';
import { useUser } from '@/contexts/user-context';
import type { UserProfile as UserProfileType } from '@/declarations/backend/backend.did';
import { userInitials } from '@/lib/user';

type UserProfileProps = {
  user: UserProfileType;
  showId?: boolean;
};

export const UserProfile: React.FC<UserProfileProps> = ({
  user,
  showId = false,
}) => {
  const { user: currentUser } = useUser();
  const isCurrentUser = currentUser?.id === user.id;

  return (
    <div className="flex items-center space-x-4">
      <Avatar className="h-8 w-8">
        <AvatarFallback>{userInitials(user)}</AvatarFallback>
      </Avatar>
      <div>
        <p className="text-sm font-medium leading-none">
          {user.username}
          {isCurrentUser && ' (You)'}
        </p>
        {showId && (
          <UserIdDisplay
            userId={user.id}
            className="[&>p]:whitespace-normal [&>p]:md:whitespace-nowrap"
          />
        )}
      </div>
    </div>
  );
};
