import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { DashboardHeader } from '@/components/dashboard-header';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';
import { Route as LoginRoute } from '@/routes/(unauthenticated)/login';
import { Route as UnassignedRoute } from '@/routes/(authenticated)/admin/unassigned';

export const Route = createFileRoute('/(authenticated)/admin')({
  beforeLoad: ({ context, location }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: LoginRoute.to, replace: true });
    }
    if (
      context.user &&
      context.user.isUnassigned &&
      !location.pathname.startsWith(UnassignedRoute.to)
    ) {
      throw redirect({ to: UnassignedRoute.to, replace: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = useUser();

  return (
    <div
      className={cn(
        'grid min-h-screen',
        "[grid-template-areas:'header_header_header_header_header_header_header_header_header_header_header_header''content_content_content_content_content_content_content_content_content_content_content_content']",
        'grid-cols-12 grid-rows-[65px_auto]',
        'app-background',
      )}
    >
      <DashboardHeader className="[grid-area:header]" />
      <div className="[grid-area:content]">
        {user ? <Outlet /> : <Skeleton className="h-full w-full" />}
      </div>
    </div>
  );
}
