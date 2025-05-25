import { createFileRoute, redirect } from '@tanstack/react-router';
import { Route as LoginRoute } from '@/routes/(unauthenticated)/login';
import { Route as AdminRoute } from '@/routes/(authenticated)/admin';

export const Route = createFileRoute('/')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: LoginRoute.to, replace: true });
    } else if (location.pathname === Route.to) {
      throw redirect({ to: AdminRoute.to, replace: true });
    }
  },
});
