import type { UserRole } from '@/declarations/backend/backend.did';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { enumKey } from '@/lib/utils';
import { USER_ROLES } from '@/constants/user';

type UserRoleBadgeProps = BadgeProps & {
  userRole: UserRole;
};

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  userRole,
  ...props
}) => {
  return <Badge {...props}>{USER_ROLES[enumKey(userRole)]}</Badge>;
};
