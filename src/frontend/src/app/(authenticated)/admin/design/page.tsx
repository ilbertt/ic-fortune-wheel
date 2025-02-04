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
import { Wheel } from 'react-custom-roulette';
import Pointer from '@/assets/wheel/pointer.png';
import { SortableWheelPrizesList } from './SortableWheelPrizesList';
import { useWheelPrizes } from '@/contexts/wheel-prizes-context';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useAtom } from 'jotai';
import { wheelAtom } from './atoms';

export default function Page() {
  const {
    wheelData,
    isDirty,
    savePrizes,
    resetChanges,
    fetchPrizes,
    fetching,
  } = useWheelPrizes();
  const [wheel, setWheel] = useAtom(wheelAtom);

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
            <div className="flex justify-center">
              {wheelData.length > 0 && (
                // <div className="size-[400px]">
                <Wheel
                  mustStartSpinning={wheel.extractPrizeIndex !== null}
                  onStopSpinning={() => setWheel({ extractPrizeIndex: null })}
                  prizeNumber={wheel.extractPrizeIndex ?? -1}
                  startingOptionIndex={0}
                  data={wheelData}
                  outerBorderWidth={0}
                  pointerProps={{
                    src: Pointer.src,
                    style: {
                      transform: 'translate(-22%, 20%) rotate(250deg)',
                    },
                  }}
                />
                // </div>
              )}
            </div>
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
