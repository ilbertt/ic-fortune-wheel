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
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import FortuneWheel from '@/components/wheel/wheel';
import { FortuneWheelContainer } from '@/components/wheel/container';
import { FortuneWheelLogo } from '@/components/wheel/logo';
import { FortuneWheelModal } from '@/components/wheel/modal';

export default function Page() {
  const {
    wheelData,
    isDirty,
    savePrizes,
    resetChanges,
    fetchPrizes,
    fetching,
  } = useWheelPrizes();

  return (
    <PageLayout>
      <PageHeader title="Design" />
      <PageContent>
        <Card className="col-span-full md:col-span-5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              Available Prizes ({wheelData.length}){' '}
              <Button
                size="icon"
                variant="outline"
                onClick={fetchPrizes}
                loading={fetching}
              >
                <RefreshCw />
              </Button>
            </CardTitle>
            <CardDescription>
              You can change them in the{' '}
              <Link href="/admin/assets" className="text-indaco-blue underline">
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
                disabled={fetching}
              >
                Cancel
              </Button>
              <Button onClick={savePrizes} loading={fetching}>
                Save
              </Button>
            </CardFooter>
          )}
        </Card>
        <Card className="col-span-full md:col-span-7">
          <CardHeader className="flex flex-col justify-between md:flex-row md:items-start">
            <div className="flex flex-col space-y-1.5">
              <CardTitle>Fortune Wheel Preview</CardTitle>
              <CardDescription>
                The preview of how the Fortune Wheel will look like. The
                dedicated Fortune Wheel page is available{' '}
                <Link
                  href="/fw"
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
              <FortuneWheel className="size-[250px] lg:size-[350px] xl:size-[450px]">
                <FortuneWheelLogo className="max-w-36 lg:w-1/5 lg:p-4 xl:p-8" />
                <FortuneWheelModal />
              </FortuneWheel>
            </FortuneWheelContainer>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
