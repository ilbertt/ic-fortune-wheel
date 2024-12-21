'use client';

import { printVersionToConsole } from '@/lib/utils';

printVersionToConsole();

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
