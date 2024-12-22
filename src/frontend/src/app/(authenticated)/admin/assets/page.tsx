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
import { WheelAsset, WheelAssetType } from '@/declarations/backend/backend.did';
import { PlusCircle, Send } from 'lucide-react';

type TokenRowProps = {
  token: Omit<WheelAsset, 'asset_type'> & {
    asset_type: Extract<WheelAssetType, { token: unknown }>;
  };
};

const TokenRow: React.FC<TokenRowProps> = ({ token }) => {
  return (
    <div className='grid grid-cols-[theme("spacing.10")_1fr_auto] items-center gap-4'>
      <Avatar>
        <AvatarImage src="https://github.com/indaco.png" />
      </Avatar>
      <div className="font-medium">{token.name}</div>
      <div className="*:text-right">
        <p className="m-0 font-medium leading-none">1</p>
        <span className="text-xs font-light text-slate-400">$100.00</span>
      </div>
    </div>
  );
};

export default function Page() {
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
                <h3 className="text-center text-4xl font-bold">$65,100.00</h3>
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
              {/* <TokenRow token="token" /> */}
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
        </Card>
      </PageContent>
    </PageLayout>
  );
}
