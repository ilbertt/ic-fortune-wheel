'use client';

import { WheelPrizesProvider } from '@/contexts/wheel-prizes-context';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <WheelPrizesProvider>{children}</WheelPrizesProvider>;
}
