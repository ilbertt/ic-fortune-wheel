import { UserRole } from '@/lib/api/backend/backend';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { USER_ROLES } from '@/constants/user';

type UserRoleBadgeProps = BadgeProps & {
  userRole: UserRole;
};

export const UserRoleBadge: React.FC<UserRoleBadgeProps> = ({
  userRole,
  ...props
}) => {
  return <Badge {...props}>{USER_ROLES[userRole]}</Badge>;
};
