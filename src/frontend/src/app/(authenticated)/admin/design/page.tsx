'use client';

import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import Link from 'next/link';
import { SortableWheelPrizesList } from './SortableWheelPrizesList';
import { useWheelPrizes } from '@/hooks/use-wheel-prizes';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import FortuneWheel from '@/components/wheel/wheel';
import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';
import { ROUTES } from '@/lib/routes';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { WheelPrizeNameWithIcon } from '@/components/wheel-prize-name-with-icon';
import { useWheelData } from '@/hooks/use-wheel-data';
import { useWheelPrizesWithProbability } from '@/hooks/use-wheel-prizes-with-probability';

export default function Page() {
  const {
    orderedPrizes,
    isDirty,
    savePrizes,
    resetChanges,
    fetchWheelPrizes,
    isWheelPrizesFetching,
    savingPrizes,
  } = useWheelPrizes();
  const wheelData = useWheelData({ prizes: orderedPrizes });
  const wheelPrizesWithProbability = useWheelPrizesWithProbability({
    prizes: orderedPrizes,
  });

  return (
    <PageLayout>
      <PageHeader title="Design" />
      <PageContent>
        <Card className="col-span-full md:col-span-6">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Available Prizes ({orderedPrizes.length}){' '}
              <Button
                size="icon"
                variant="outline"
                onClick={fetchWheelPrizes}
                loading={isWheelPrizesFetching}
              >
                <RefreshCw />
              </Button>
            </CardTitle>
            <CardDescription>
              You can change them in the{' '}
              <Link
                href={ROUTES.dashboard.assets}
                className="text-indaco-blue underline"
              >
                Assets
              </Link>{' '}
              page. Drag and drop to reorder.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SortableWheelPrizesList />
          </CardContent>
          {isDirty && (
            <CardFooter className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={resetChanges}
                disabled={isWheelPrizesFetching || savingPrizes}
              >
                Cancel
              </Button>
              <Button
                onClick={savePrizes}
                loading={isWheelPrizesFetching || savingPrizes}
              >
                Save
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card className="col-span-full md:col-span-6">
          <CardHeader className="flex flex-col justify-between md:flex-row md:items-start">
            <div className="flex flex-col space-y-1.5">
              <CardTitle>Fortune Wheel Preview</CardTitle>
              <CardDescription>
                The preview of how the Fortune Wheel will look like. The
                dedicated Fortune Wheel page is available{' '}
                <Link
                  href={ROUTES.fortuneWheel}
                  target="_blank"
                  className="text-indaco-blue underline"
                >
                  here
                </Link>
                .
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <FortuneWheelContainer className="py-4 md:py-8">
              <FortuneWheel
                className="size-[250px] lg:size-[350px] xl:size-[450px]"
                wheelData={wheelData}
              >
                <FortuneWheelLogo className="max-w-36 lg:w-1/5 lg:p-4 xl:p-8" />
                <FortuneWheelModal />
              </FortuneWheel>
            </FortuneWheelContainer>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prize</TableHead>
                  <TableHead>Draw Probability</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wheelPrizesWithProbability.map((prize, index) => (
                  <TableRow key={`${prize.wheel_asset_id}-${index}`}>
                    <TableCell>
                      <WheelPrizeNameWithIcon wheelPrize={prize} />
                    </TableCell>
                    <TableCell>
                      {prize.drawProbability.toLocaleString(undefined, {
                        maximumFractionDigits: 2,
                        style: 'percent',
                      })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
