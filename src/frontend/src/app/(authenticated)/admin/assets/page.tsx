'use client';

import { BorderVerticalGradientContainer } from '@/components/border-gradient-container';
import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
  isWheelAssetDisabled,
  isWheelAssetToken,
  wheelAssetBalance,
  wheelAssetsUsdValueSum,
  wheelAssetTokenTotalUsdValue,
  wheelAssetUrl,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { CircleDollarSign, PlusCircle, RefreshCcw, Send } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { TopUpModal } from './modals';
import { AssetsTable } from './AssetsTable';
import { Loader } from '@/components/loader';

const FETCH_ASSETS_INTERVAL = 30_000;

type TokenRowProps = {
  token: WheelAssetToken;
  refreshingTokens: boolean;
};

const TokenRow: React.FC<TokenRowProps> = ({ token, refreshingTokens }) => {
  return (
    <div className='grid grid-cols-[theme("spacing.10")_1fr_auto] items-center gap-4'>
      <Avatar>
        <AvatarImage src={wheelAssetUrl(token.wheel_image_path)} />
        <AvatarFallback>
          <CircleDollarSign />
        </AvatarFallback>
      </Avatar>
      <div className="font-medium">{token.name}</div>
      <div className="flex flex-col items-end gap-0.5 *:text-right">
        {refreshingTokens ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <p className="m-0 font-medium leading-none">
            {wheelAssetBalance(token)}
          </p>
        )}
        {refreshingTokens ? (
          <Skeleton className="h-4 w-14" />
        ) : (
          <span className="text-xs font-light text-slate-400">
            {renderUsdValue(wheelAssetTokenTotalUsdValue(token))}
          </span>
        )}
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
  const [refreshingTokens, setRefreshingTokens] = useState(false);
  const [assets, setAssets] = useState<{
    enabled: WheelAsset[];
    disabled: WheelAsset[];
  }>({ enabled: [], disabled: [] });
  const [tokenAssets, setTokenAssets] = useState<WheelAssetToken[]>([]);
  const { toast } = useToast();

  const fetchAssets = useCallback(async () => {
    return actor
      ?.list_wheel_assets({ state: [] })
      .then(extractOk)
      .then(res => {
        const newAssets = res.reduce(
          (acc, asset) => {
            if (isWheelAssetDisabled(asset)) {
              acc.disabled.push(asset);
            } else {
              acc.enabled.push(asset);
            }
            return acc;
          },
          { enabled: [] as WheelAsset[], disabled: [] as WheelAsset[] },
        );
        setAssets(newAssets);
        const tokenAssetsArr = res
          .filter(isWheelAssetToken)
          .sort((a, b) =>
            wheelAssetTokenTotalUsdValue(a) > wheelAssetTokenTotalUsdValue(b)
              ? -1
              : 1,
          );
        setTokenAssets(tokenAssetsArr);
      })
      .catch((e: Err) => {
        toast({
          title: 'Error fetching assets',
          description: renderError(e),
          variant: 'destructive',
        });
      });
  }, [actor, toast]);

  const handleRefresh = useCallback(() => {
    setRefreshingTokens(true);
    actor
      .fetch_tokens_data()
      .then(extractOk)
      .then(() => new Promise(resolve => setTimeout(resolve, 10_000)))
      .then(fetchAssets)
      .catch((e: Err) => {
        toast({
          title: 'Error refreshing tokens',
          description: renderError(e),
          variant: 'destructive',
        });
      })
      .finally(() => setRefreshingTokens(false));
  }, [actor, toast, fetchAssets]);

  useEffect(() => {
    setFetchingAssets(true);
    fetchAssets().finally(() => setFetchingAssets(false));

    const intervalId = setInterval(fetchAssets, FETCH_ASSETS_INTERVAL);
    return () => clearInterval(intervalId);
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
                {fetchingAssets || refreshingTokens ? (
                  <div className="flex w-full justify-center">
                    <Skeleton className="mt-1 h-10 w-48" />
                  </div>
                ) : (
                  <h3 className="text-center text-4xl font-bold">
                    {renderUsdValue(wheelAssetsUsdValueSum(tokenAssets))}
                  </h3>
                )}
                <div className="mt-4 flex flex-row flex-wrap items-center justify-center gap-4">
                  <TopUpModal />
                  <Button variant="outline">
                    <Send />
                    Send
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleRefresh}
                    loading={refreshingTokens}
                  >
                    <RefreshCcw />
                    Refresh
                  </Button>
                </div>
              </div>
            </BorderVerticalGradientContainer>
            <div className="mt-6 flex flex-col gap-6 px-4">
              {fetchingAssets && <Loader className="self-center" />}
              {!fetchingAssets && tokenAssets.length === 0 ? (
                <p>No tokens found</p>
              ) : (
                tokenAssets.map(token => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    refreshingTokens={refreshingTokens}
                  />
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
            {fetchingAssets && <Loader />}
            {!fetchingAssets &&
            assets.enabled.length === 0 &&
            assets.disabled.length === 0 ? (
              <EmptyAssets fetchAssets={fetchAssets} />
            ) : (
              <div className="flex flex-col gap-4">
                {assets.enabled.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-sm">Enabled</CardTitle>
                    <AssetsTable
                      data={assets.enabled}
                      fetchAssets={fetchAssets}
                    />
                  </div>
                )}
                {assets.disabled.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-sm">Disabled</CardTitle>
                    <AssetsTable
                      data={assets.disabled}
                      fetchAssets={fetchAssets}
                    />
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
