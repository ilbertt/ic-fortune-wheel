import { appVersion, cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import {
  History,
  LayoutDashboard,
  LoaderPinwheel,
  LogOut,
  PenLine,
  ScanLine,
  Settings2,
  User,
  Users,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { Children, useCallback } from 'react';
import { GithubIcon } from '@/components/icons';
import { GITHUB_REPO_URL } from '@/constants';
import { UserIdDisplay } from '@/components/user-id-display';
import { Loader } from '@/components/loader';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { UserRoleBadge } from '@/components/user-role-badge';
import { useUser } from '@/hooks/use-user';
import {
  Link,
  type RegisteredRouter,
  useRouter,
  type ValidateLinkOptions,
} from '@tanstack/react-router';
import { Route as HomeRoute } from '@/routes';
import { Route as FwRoute } from '@/routes/(unauthenticated)/fw';
import { Route as DashboardRoute } from '@/routes/(authenticated)/admin';
import { Route as TeamRoute } from '@/routes/(authenticated)/admin/team';
import { Route as ScannerRoute } from '@/routes/(authenticated)/admin/scanner';
import { Route as DesignRoute } from '@/routes/(authenticated)/admin/design';
import { Route as AssetsRoute } from '@/routes/(authenticated)/admin/assets';

type HeaderLinkProps<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
> = {
  title: string;
  icon: LucideIcon;
  linkOptions: ValidateLinkOptions<TRouter, TOptions>;
};

function HeaderLink<
  TRouter extends RegisteredRouter = RegisteredRouter,
  TOptions = unknown,
>({ title, linkOptions, icon: Icon }: HeaderLinkProps<TRouter, TOptions>) {
  return (
    <Link
      className={cn(
        '[&>svg]:text-indaco-blue flex flex-row items-center justify-center gap-1.5 p-2 text-sm font-medium text-slate-400 [&>svg]:size-4',
        linkOptions.className,
      )}
      activeProps={{
        className: '!text-primary',
      }}
      activeOptions={{ exact: true }}
      {...linkOptions}
    >
      <Icon />
      <span>{title}</span>
    </Link>
  );
}

type UserNavProps = {
  headerLinks: React.ReactNode;
};

const UserNav: React.FC<UserNavProps> = ({ headerLinks }) => {
  const { logout } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleLogout = useCallback(async () => {
    await logout();
    await router.invalidate();
    router.history.push(HomeRoute.to);
  }, [logout, router]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="bg-infinite relative h-8 w-8 rounded-full"
          disabled={!user}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-infinite">
              {user ? <User /> : <Loader />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="[&>a>svg]:text-foreground [&>a]:text-foreground w-56 [&>a]:justify-start"
        align="end"
        forceMount
      >
        {user && (
          <>
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  {user.username}
                  <EditUserDialog
                    triggerButton={
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-indaco-blue size-6"
                      >
                        <PenLine />
                      </Button>
                    }
                  />
                </div>
                <p className="text-xs font-light">User ID</p>
                <UserIdDisplay userId={user.id} />
                <UserRoleBadge userRole={user.role} />
                {/*
                  TODO: decide if we want to display the principal
                  <p className="text-xs font-light">Principal</p>
                  <PrincipalDisplay principal={user.principal_id} />
                */}
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
          </>
        )}
        {Children.count(headerLinks) > 0 && (
          <>
            {headerLinks}
            <DropdownMenuSeparator />
          </>
        )}
        <DropdownMenuItem className="[&>img]:size-4" asChild>
          <Link to={FwRoute.to} target="_blank">
            <LoaderPinwheel />
            Fortune Wheel
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-indaco-blue" onClick={handleLogout}>
          <LogOut /> Log out
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="[&>img]:size-4" asChild>
          <a href={GITHUB_REPO_URL} target="_blank">
            <GithubIcon />
            GitHub
          </a>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-xs" disabled>
          <History />
          <code>{appVersion}</code>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

type DashboardHeaderProps = {
  className?: string;
};

export const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  className,
}) => {
  const { isCurrentUserAdmin, isCurrentUserUnassigned } = useUser();

  const headerLinks = [
    ...(!isCurrentUserUnassigned
      ? [
          <HeaderLink
            key="dashboard-header-link-dashboard"
            title="Dashboard"
            icon={LayoutDashboard}
            linkOptions={{ to: DashboardRoute.to }}
          />,
        ]
      : []),
    ...(isCurrentUserAdmin
      ? [
          <HeaderLink
            key="dashboard-header-link-assets"
            title="Assets"
            icon={WalletMinimal}
            linkOptions={{ to: AssetsRoute.to }}
          />,
        ]
      : []),
    ...(isCurrentUserAdmin
      ? [
          <HeaderLink
            key="dashboard-header-link-team"
            title="Team"
            icon={Users}
            linkOptions={{ to: TeamRoute.to }}
          />,
        ]
      : []),
    ...(!isCurrentUserUnassigned
      ? [
          <HeaderLink
            key="dashboard-header-link-design"
            title="Design"
            icon={Settings2}
            linkOptions={{ to: DesignRoute.to }}
          />,
        ]
      : []),
  ];

  return (
    // we need to wrap divs in order to obtain the proper background color
    <div
      className={cn(
        'bg-background fixed inset-x-0 top-0 z-50 h-[65px] border-b',
        className,
      )}
    >
      <div className="bg-dark-infinite/25 flex h-full w-full flex-row items-center justify-between px-4 md:px-8">
        <Logo />
        <div className="hidden flex-1 flex-row items-center justify-center md:flex">
          {headerLinks}
        </div>
        <div className="flex flex-row items-center justify-end gap-6">
          {!isCurrentUserUnassigned && (
            <Button variant="border-gradient" asChild>
              <Link to={ScannerRoute.to}>
                <ScanLine /> Scanner
              </Link>
            </Button>
          )}
          <UserNav headerLinks={headerLinks} />
        </div>
      </div>
    </div>
  );
};
