'use client';

import { DashboardHeader } from '@/components/dashboard-header';
import { ActivityProvider } from '@/contexts/activity-context';
import { TeamMembersProvider } from '@/contexts/team-members-context';
import { UserProvider } from '@/contexts/user-context';
import { WheelAssetsProvider } from '@/contexts/wheel-assets-context';
import { WheelPrizesProvider } from '@/contexts/wheel-prizes-context';
import { cn, printVersionToConsole } from '@/lib/utils';

printVersionToConsole();

const FETCH_ASSETS_INTERVAL_MS = 30_000;
const FETCH_ACTIVITY_INTERVAL_MS = 2_000;

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <UserProvider>
      <TeamMembersProvider>
        <WheelAssetsProvider refreshIntervalMs={FETCH_ASSETS_INTERVAL_MS}>
          <ActivityProvider refreshIntervalMs={FETCH_ACTIVITY_INTERVAL_MS}>
            <WheelPrizesProvider>
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
            </WheelPrizesProvider>
          </ActivityProvider>
        </WheelAssetsProvider>
      </TeamMembersProvider>
    </UserProvider>
  );
}
