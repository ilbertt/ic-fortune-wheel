'use client';

import { cn, renderError } from '@/lib/utils';
import { Logo } from '@/components/logo';
import {
  LayoutDashboard,
  Loader2,
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
import { useCallback, useState } from 'react';
import { GithubIcon } from '@/components/icons';
import { CopyToClipboardButton } from './copy-to-clipboard-button';
import { GITHUB_REPO_URL } from '@/constants';
import { useUser } from '@/contexts/user-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

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

const editUserFormSchema = z.object({
  username: z.string().min(1),
});

const EditUserDialog = () => {
  const { actor } = useAuth();
  const { user, fetchUser } = useUser();
  const form = useForm<z.infer<typeof editUserFormSchema>>({
    resolver: zodResolver(editUserFormSchema),
    mode: 'onChange',
    defaultValues: {
      username: user?.username || '',
    },
  });
  const { isValid: isFormValid, isSubmitting: isFormSubmitting } =
    form.formState;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: z.infer<typeof editUserFormSchema>) => {
    await actor
      .update_my_user_profile({
        username: [data.username],
      })
      .then(async res => {
        if ('ok' in res) {
          await fetchUser();
          setOpen(false);
        } else {
          toast({
            title: 'Error updating user',
            description: renderError(res.err),
            variant: 'destructive',
          });
        }
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" className="text-indaco-blue size-6">
          <PenLine />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                loading={isFormSubmitting}
                disabled={!isFormValid}
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

const UserNav = () => {
  const { logout, identity } = useAuth();
  const { user } = useUser();

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
          disabled={!user}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-infinite">
              {Boolean(user) ? <User /> : <Loader2 className="animate-spin" />}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <div className="flex items-center gap-1 text-sm font-semibold">
              {user?.username}
              <EditUserDialog />
            </div>
            <p className="text-xs font-light">User ID</p>
            <div className="flex max-w-full flex-row items-center gap-1 overflow-hidden">
              <p className="text-muted-foreground flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none">
                {user?.id}
              </p>
              <CopyToClipboardButton value={user?.id as string} />
            </div>
            <p className="text-xs font-light">Principal</p>
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
