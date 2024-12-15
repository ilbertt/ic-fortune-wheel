'use client';

import { cn } from '@/lib/utils';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  LogOut,
  PenLine,
  ScanLine,
  Settings2,
  User,
  Users,
  WalletMinimal,
  type LucideIcon,
} from 'lucide-react';
import Link from 'next/link';
import { ROUTES } from '@/lib/routes';
import { usePathname } from 'next/navigation';
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
import { useAuth } from '@/contexts/auth-context';
import { useCallback } from 'react';
import { GithubIcon } from '@/components/icons';
import { CopyToClipboardButton } from './copy-to-clipboard-button';
import { GITHUB_REPO_URL } from '@/constants';

type HeaderLinkProps = {
  title: string;
  href: string;
  icon: LucideIcon;
};

const HeaderLink: React.FC<HeaderLinkProps> = ({ title, href, icon: Icon }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={cn(
        '[&>svg]:text-indaco-blue flex flex-row items-center justify-center gap-1.5 p-2 text-sm font-medium text-slate-400 [&>svg]:size-4',
        {
          'text-primary': isActive,
        },
      )}
    >
      <Icon />
      <span>{title}</span>
    </Link>
  );
};

const UserNav = () => {
  const { logout, identity } = useAuth();

  const handleLogout = useCallback(() => {
    logout();
    window.location.reload();
  }, [logout]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="bg-infinite relative h-8 w-8 rounded-full"
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-infinite">
              <User />
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel className="flex items-center gap-1 text-sm font-semibold">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1 text-sm font-semibold">
              Bob
              <Button
                size="icon"
                variant="ghost"
                className="text-indaco-blue size-6"
              >
                <PenLine />
              </Button>
            </div>
            <div className="flex flex-row flex-wrap items-center gap-1">
              <p className="text-muted-foreground text-xs leading-none">
                {identity
                  .getPrincipal()
                  .toText()
                  .replace(/^(.{10})(.*)(.{10})$/, '$1…$3')}
              </p>
              <CopyToClipboardButton value={identity.getPrincipal().toText()} />
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="[&>img]:size-4" asChild>
          <Link href={GITHUB_REPO_URL} target="_blank">
            <GithubIcon />
            GitHub
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-indaco-blue" onClick={handleLogout}>
          <LogOut /> Log out
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
  return (
    <div
      className={cn(
        'fixed inset-x-0 top-0 z-50 flex h-[65px] flex-row items-center justify-between border-b px-8',
        className,
      )}
    >
      <Logo />
      <div className="flex flex-1 flex-row items-center justify-center">
        <HeaderLink
          title="Dashboard"
          href={ROUTES.dashboard.ROOT}
          icon={LayoutDashboard}
        />
        <HeaderLink
          title="Assets"
          href={ROUTES.dashboard.assets}
          icon={WalletMinimal}
        />
        <HeaderLink title="Team" href={ROUTES.dashboard.team} icon={Users} />
        <HeaderLink
          title="Design"
          href={ROUTES.dashboard.design}
          icon={Settings2}
        />
      </div>
      <div className="flex flex-row items-center justify-end gap-6">
        <Button variant="outline">
          <ScanLine /> Scanner
        </Button>
        <UserNav />
      </div>
    </div>
  );
};
