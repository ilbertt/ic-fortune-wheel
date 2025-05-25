import { type AuthContextType } from '@/contexts/auth-context';
import { UseUserReturn } from '@/hooks/use-user';
import { Outlet, createRootRouteWithContext } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

type RouterContext = {
  auth: AuthContextType;
  user: UseUserReturn['user'];
};

export const Route = createRootRouteWithContext<RouterContext>()({
  component: () => (
    <>
      <Outlet />
      <TanStackRouterDevtools />
    </>
  ),
});
