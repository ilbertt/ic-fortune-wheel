import { DashboardHeader } from '@/components/dashboard-header';
import { cn } from '@/lib/utils';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={cn(
        'grid min-h-screen',
        "[grid-template-areas:'header_header_header_header_header_header_header_header_header_header_header_header''content_content_content_content_content_content_content_content_content_content_content_content']",
        'grid-rows-[65px_auto]',
        'from-dark-infinite to-dark-infinite/25 bg-[radial-gradient(ellipse_at_bottom,_var(--tw-gradient-stops))]',
      )}
    >
      <DashboardHeader className="[grid-area:header]" />
      <div className="[grid-area:content]">{children}</div>
    </div>
  );
}