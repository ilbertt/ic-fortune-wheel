import { createFileRoute } from '@tanstack/react-router';
import { Button } from '@/components/ui/button';
import { PageLayout, PageContent, PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, User, Users } from 'lucide-react';
import { EditUserDialog } from '@/components/edit-user-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { renderUsdValue } from '@/lib/utils';
import { ActivityTable } from '@/components/activity-table';
import { useWheelPrizeExtractionsStats } from '@/hooks/use-wheel-prize-extractions-stats';
import { useUser } from '@/hooks/use-user';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { Route as AssetsRoute } from '@/routes/(authenticated)/admin/assets';
import { Link } from '@tanstack/react-router';
import { useWheelAssetTokensUseValueSum } from '@/hooks/use-wheel-asset-tokens-use-value-sum';

export const Route = createFileRoute('/(authenticated)/admin/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { isCurrentUserUnassigned } = useUser();
  const { fetchingTokenAssets } = useWheelAssetTokens();
  const { stats } = useWheelPrizeExtractionsStats();
  const { usdValueSum } = useWheelAssetTokensUseValueSum();

  return (
    <PageLayout>
      <PageHeader title="Dashboard" />
      <PageContent>
        {!isCurrentUserUnassigned && (
          <>
            <Card className="col-span-full md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participants
                </CardTitle>
                <Users className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {stats ? (
                  <>
                    {stats.total_completed_extractions}{' '}
                    <span className="text-muted-foreground text-xs">
                      (excl. failed extractions)
                    </span>
                  </>
                ) : (
                  <Skeleton className="mt-1 h-10 w-48" />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-full md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spent</CardTitle>
                <CreditCard className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {stats ? (
                  renderUsdValue(stats.total_spent_usd)
                ) : (
                  <Skeleton className="mt-1 h-10 w-48" />
                )}
              </CardContent>
            </Card>
            <Card className="col-span-full md:col-span-4">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <DollarSign className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">
                {fetchingTokenAssets ? (
                  <Skeleton className="mt-1 h-10 w-48" />
                ) : (
                  <div className="flex flex-row flex-wrap justify-between gap-2">
                    {renderUsdValue(usdValueSum)}
                    <Button size="sm" variant="outline" asChild>
                      <Link to={AssetsRoute.to}>Go to Wallet</Link>
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="col-span-full">
              <CardHeader>
                <CardTitle>Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityTable />
              </CardContent>
            </Card>
          </>
        )}
        {isCurrentUserUnassigned && (
          <div className="col-span-full flex flex-col items-center justify-center gap-2 text-center">
            <h2 className="text-2xl">
              You must wait for an admin to assign you a role.
            </h2>
            <EditUserDialog
              triggerButton={
                <Button variant="default">
                  <User />
                  Edit your profile
                </Button>
              }
            />
          </div>
        )}
      </PageContent>
    </PageLayout>
  );
}
