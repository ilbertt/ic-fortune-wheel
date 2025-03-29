'use client';

import { WheelPrizesProvider } from '@/hooks/use-wheel-prizes';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WheelPrizesProvider>{children}</WheelPrizesProvider>;
}
