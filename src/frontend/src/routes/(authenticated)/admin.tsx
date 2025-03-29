import { createFileRoute, Outlet, redirect } from '@tanstack/react-router';
import { DashboardHeader } from '@/components/dashboard-header';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Skeleton } from '@/components/ui/skeleton';

export const Route = createFileRoute('/(authenticated)/admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth.isAuthenticated) {
      throw redirect({ to: '/login' });
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
