'use client';

import { BorderVerticalGradientContainer } from '@/components/border-gradient-container';
import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import { Avatar, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/auth-context';
import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError, renderUsdValue } from '@/lib/utils';
import {
  isWheelAssetToken,
  wheelAssetsUsdValueSum,
  wheelAssetTokenTotalUsdValue,
  type WheelAssetToken,
} from '@/lib/wheelAsset';
import { Loader2, PlusCircle, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

type TokenRowProps = {
  token: WheelAssetToken;
};

const TokenRow: React.FC<TokenRowProps> = ({ token }) => {
  return (
    <div className='grid grid-cols-[theme("spacing.10")_1fr_auto] items-center gap-4'>
      <Avatar>
        <AvatarImage src="https://github.com/indaco.png" />
      </Avatar>
      <div className="font-medium">{token.name}</div>
      <div className="*:text-right">
        <p className="m-0 font-medium leading-none">{token.total_amount}</p>
        <span className="text-xs font-light text-slate-400">
          {renderUsdValue(wheelAssetTokenTotalUsdValue(token))}
        </span>
      </div>
    </div>
  );
};

type EmptyAssetsProps = {
  fetchAssets: () => Promise<void>;
};

const EmptyAssets: React.FC<EmptyAssetsProps> = ({ fetchAssets }) => {
  const { actor } = useAuth();
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSetDefaultAssets = useCallback(() => {
    setIsLoading(true);
    actor
      .set_default_wheel_assets()
      .then(extractOk)
      .then(fetchAssets)
      .finally(() => setIsLoading(false));
  }, [fetchAssets, actor]);

  return (
    <div className="mt-4 flex flex-col items-center gap-4">
      <h3 className="text-xl">No assets found</h3>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary">Create Default Assets</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Default Assets</DialogTitle>
            <DialogDescription>
              This will create the following assets: ICP, ckBTC, ckETH, ckUSDC.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button loading={isLoading} onClick={handleSetDefaultAssets}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default function Page() {
  const { actor } = useAuth();
  const [fetchingAssets, setFetchingAssets] = useState(false);
  const [assets, setAssets] = useState<WheelAsset[]>([]);
  const [tokenAssets, setTokenAssets] = useState<WheelAssetToken[]>([]);
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    return actor
      .list_wheel_assets({ state: [] })
      .then(extractOk)
      .then(res => {
        setAssets(res);
        setTokenAssets(res.filter(isWheelAssetToken));
      })
      .catch((e: Err) => {
        toast({
          title: 'Error fetching assets',
          description: renderError(e),
          variant: 'destructive',
        });
      });
  }, [actor, toast]);

  useEffect(() => {
    setFetchingAssets(true);
    fetchAssets().finally(() => setFetchingAssets(false));
  }, [fetchAssets]);

  return (
    <PageLayout>
      <PageHeader title="Assets" />
      <PageContent>
        <Card className="col-span-full md:col-span-4">
          <CardHeader>
            <CardTitle>Wallet</CardTitle>
            <CardDescription>Manage your tokens</CardDescription>
          </CardHeader>
          <CardContent>
            <BorderVerticalGradientContainer className="from-infinite rounded-xl to-[#c572ef]/0 [--border-width:1px]">
              <div className="bg-card/40 grid bg-gradient-to-b from-[#f8fafc]/10 to-[#f8fafc]/0 pb-1.5 pt-7">
                <p className="text-center text-xs font-medium">
                  Available Balance
                </p>
                {fetchingAssets ? (
                  <div className="flex w-full justify-center">
                    <Skeleton className="h-10 w-48" />
                  </div>
                ) : (
                  <h3 className="text-center text-4xl font-bold">
                    {renderUsdValue(wheelAssetsUsdValueSum(tokenAssets))}
                  </h3>
                )}
                <div className="mt-4 flex flex-row items-center justify-center gap-4">
                  <Button variant="outline">
                    <PlusCircle />
                    Top-up
                  </Button>
                  <Button variant="outline">
                    <Send />
                    Send
                  </Button>
                </div>
              </div>
            </BorderVerticalGradientContainer>
            <div className="mt-6 flex flex-col gap-6 px-4">
              {fetchingAssets && <Loader2 className="animate-spin" />}
              {!fetchingAssets && tokenAssets.length === 0 ? (
                <p>No tokens found</p>
              ) : (
                tokenAssets.map(token => (
                  <TokenRow key={token.id} token={token} />
                ))
              )}
            </div>
          </CardContent>
        </Card>
        <Card className="col-span-full md:col-span-8">
          <CardHeader className="flex flex-col justify-between md:flex-row md:items-start">
            <div className="flex flex-col space-y-1.5">
              <CardTitle>Settings</CardTitle>
              <CardDescription>Tokens + Gadget + Jackpot</CardDescription>
            </div>
            <Button variant="outline">
              <PlusCircle />
              Add Asset
            </Button>
          </CardHeader>
          <CardContent>
            {fetchingAssets && <Loader2 className="animate-spin" />}
            {!fetchingAssets && assets.length === 0 ? (
              <EmptyAssets fetchAssets={fetchAssets} />
            ) : (
              // TODO: implement assets table
              assets.map(el => <p key={el.id}>{el.name}</p>)
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
