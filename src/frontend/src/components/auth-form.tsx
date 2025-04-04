import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useCallback, useState } from 'react';
import { InfinityIcon, LoaderPinwheel } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Link, useRouter } from '@tanstack/react-router';
import { Route as AdminRoute } from '@/routes/(authenticated)/admin';
import { Route as FwRoute } from '@/routes/(unauthenticated)/fw';

type AuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function AuthForm({ className, ...props }: AuthFormProps) {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleLogin = useCallback(async () => {
    setIsLoading(true);
    await login();
    await router.invalidate();
    router.history.push(AdminRoute.to);
  }, [login, router]);

  return (
    <div
      className={cn('grid w-full gap-6 px-10 sm:w-[350px] md:p-0', className)}
      {...props}
    >
      <Button loading={isLoading} onClick={handleLogin}>
        <InfinityIcon /> Sign In with Internet Identity
      </Button>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or go to the
          </span>
        </div>
      </div>
      <Button variant="secondary" type="button" loading={isLoading} asChild>
        <Link to={FwRoute.to}>
          <LoaderPinwheel />
          Fortune Wheel
        </Link>
      </Button>
    </div>
  );
}
