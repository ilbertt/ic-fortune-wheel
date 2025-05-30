import { createFileRoute } from '@tanstack/react-router';
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
import { renderNumberWithDigits, renderUsdValue } from '@/lib/utils';
import {
  isWheelAssetDisabled,
  isWheelAssetEnabled,
  wheelAssetBalance,
  type WheelAssetDisabled,
  type WheelAssetEnabled,
  wheelAssetsUsdValueSum,
  wheelAssetTokenTotalUsdValue,
  wheelAssetUrl,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { CircleDollarSign, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { TopUpModal } from '@/components/wheel-assets/modals/top-up';
import { AssetsTable } from '@/components/wheel-assets/assets-table';
import { Loader } from '@/components/loader';
import { CreateAssetModal } from '@/components/wheel-assets/modals/create';
import { useWheelAssets } from '@/hooks/use-wheel-assets';
import { SendTokenModal } from '@/components/wheel-assets/modals/send-token';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { useCreateDefaultAssets } from '@/hooks/use-create-default-assets';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import { useRefreshTokenAssets } from '@/hooks/use-refresh-token-assets';

export const Route = createFileRoute('/(authenticated)/admin/assets')({
  component: RouteComponent,
});

type TokenRowProps = {
  token: WheelAssetToken;
  refreshingTokens: boolean;
};

const TokenRow: React.FC<TokenRowProps> = ({ token, refreshingTokens }) => {
  return (
    <div className="grid grid-cols-[--spacing(10)_1fr_auto] items-center gap-4">
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
            {renderNumberWithDigits(wheelAssetBalance(token), {
              minimumFractionDigits: 2,
              maximumFractionDigits: 6,
            })}
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

const EmptyAssets: React.FC = () => {
  const [open, setOpen] = useState(false);
  const { mutate: createDefaultAssets, isPending: isLoading } =
    useCreateDefaultAssets();

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
            <Button loading={isLoading} onClick={() => createDefaultAssets()}>
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const selectEnabledAssets = (data: Array<WheelAsset>): WheelAssetEnabled[] =>
  data.filter(el => isWheelAssetEnabled(el));

const selectDisabledAssets = (data: Array<WheelAsset>): WheelAssetDisabled[] =>
  data.filter(el => isWheelAssetDisabled(el));

function RouteComponent() {
  const { data: enabledAssets, fetchingAssets: fetchingEnabledAssets } =
    useWheelAssets(selectEnabledAssets);
  const { data: disabledAssets, fetchingAssets: fetchingDisabledAssets } =
    useWheelAssets(selectDisabledAssets);
  const { tokenAssets, fetchingTokenAssets } = useWheelAssetTokens();
  const {
    mutateAsync: refreshTokenAssets,
    isPending: isRefreshingTokenAssets,
  } = useRefreshTokenAssets();

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
              <div className="bg-card/40 bg-linear-to-b grid from-[#f8fafc]/10 to-[#f8fafc]/0 pb-1.5 pt-7">
                <p className="text-center text-xs font-medium">
                  Available Balance
                </p>
                {fetchingEnabledAssets ||
                fetchingDisabledAssets ||
                fetchingTokenAssets ||
                isRefreshingTokenAssets ? (
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
                  <SendTokenModal />
                  <Button
                    variant="outline"
                    onClick={() => refreshTokenAssets()}
                    loading={isRefreshingTokenAssets}
                  >
                    <RefreshCw />
                    Refresh
                  </Button>
                </div>
              </div>
            </BorderVerticalGradientContainer>
            <div className="mt-6 flex flex-col gap-6 px-4">
              {(fetchingEnabledAssets ||
                fetchingDisabledAssets ||
                fetchingTokenAssets) && <Loader className="self-center" />}
              {!fetchingEnabledAssets &&
              !fetchingDisabledAssets &&
              !fetchingTokenAssets &&
              tokenAssets.length === 0 ? (
                <p>No tokens found</p>
              ) : (
                tokenAssets.map(token => (
                  <TokenRow
                    key={token.id}
                    token={token}
                    refreshingTokens={isRefreshingTokenAssets}
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
            <CreateAssetModal />
          </CardHeader>
          <CardContent>
            {(fetchingEnabledAssets || fetchingDisabledAssets) && <Loader />}
            {!fetchingEnabledAssets &&
            !fetchingDisabledAssets &&
            (!enabledAssets || enabledAssets.length === 0) &&
            (!disabledAssets || disabledAssets.length === 0) ? (
              <EmptyAssets />
            ) : (
              <div className="flex flex-col gap-4">
                {enabledAssets && enabledAssets.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-sm">Enabled</CardTitle>
                    <AssetsTable data={enabledAssets} />
                  </div>
                )}
                {disabledAssets && disabledAssets.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <CardTitle className="text-sm">Disabled</CardTitle>
                    <AssetsTable data={disabledAssets} />
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
