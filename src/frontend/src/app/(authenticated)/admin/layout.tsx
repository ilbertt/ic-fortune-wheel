'use client';

import { DashboardHeader } from '@/components/dashboard-header';
import { UserProvider } from '@/contexts/user-context';
import { cn, printVersionToConsole } from '@/lib/utils';

printVersionToConsole();

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <div
        className={cn(
          'grid min-h-screen',
          "[grid-template-areas:'header_header_header_header_header_header_header_header_header_header_header_header''content_content_content_content_content_content_content_content_content_content_content_content']",
          'grid-cols-12 grid-rows-[65px_auto]',
          'from-dark-infinite to-dark-infinite/25 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))]',
        )}
      >
        <DashboardHeader className="[grid-area:header]" />
        <div className="[grid-area:content]">{children}</div>
      </div>
    </UserProvider>
  );
}
