import { WheelPrizesProvider } from '@/hooks/use-wheel-prizes';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/(unauthenticated)/fw')({
  component: Layout,
});

function Layout({ children }: { children: React.ReactNode }) {
  return <WheelPrizesProvider>{children}</WheelPrizesProvider>;
}
