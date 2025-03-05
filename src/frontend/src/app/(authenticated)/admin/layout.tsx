'use client';

import { DashboardHeader } from '@/components/dashboard-header';
import { cn, printVersionToConsole } from '@/lib/utils';

printVersionToConsole();

export default function Layout({ children }: { children: React.ReactNode }) {
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
      <div className="[grid-area:content]">{children}</div>
    </div>
  );
}
