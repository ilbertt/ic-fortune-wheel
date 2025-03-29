import { WheelPrizesProvider } from '@/hooks/use-wheel-prizes';
import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/(unauthenticated)/fw')({
  component: Layout,
});

function Layout() {
  return (
    <WheelPrizesProvider>
      <Outlet />
    </WheelPrizesProvider>
  );
}
