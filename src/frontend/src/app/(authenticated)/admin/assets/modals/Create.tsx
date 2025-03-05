'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { capitalCase } from 'change-case';
import { Coins, PlusCircle, Shirt, Sparkle } from 'lucide-react';
import { useCallback, useState } from 'react';
import { AssetTokenForm } from './forms/token';
import { useAtom } from 'jotai';
import { formAssetTypeAtom } from '../atoms';
import { AssetGadgetForm } from './forms/gadget';
import { useWheelAssets } from '@/hooks/use-wheel-assets';

export const CreateAssetModal: React.FC = () => {
  const { fetchAssets } = useWheelAssets();
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useAtom(formAssetTypeAtom);

  const handleOnComplete = useCallback(async () => {
    await fetchAssets();
    setAssetType(null);
    setOpen(false);
  }, [fetchAssets, setAssetType]);

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setAssetType(null);
      }
      setOpen(open);
    },
    [setAssetType],
  );

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange}>
      <DialogTrigger asChild>
        <Button variant="border-gradient">
          <PlusCircle />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent disableClickOutside={Boolean(assetType)}>
        <DialogHeader>
          <DialogTitle>
            {assetType ? `Add a new ${capitalCase(assetType)}` : 'Create Asset'}
          </DialogTitle>
          <DialogDescription>
            {assetType
              ? `Fill in the details for the ${capitalCase(assetType)}.`
              : 'Choose the type of asset you want to create.'}
          </DialogDescription>
        </DialogHeader>
        {!assetType && (
          <div className="[&_svg]:text-indaco-blue flex flex-col gap-2 [&>button]:h-16 [&>button]:gap-4 [&>button]:text-xl [&>button]:font-semibold [&_svg]:size-7">
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAssetType('token')}
            >
              <Coins />
              Token
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setAssetType('gadget')}
            >
              <Shirt />
              Gadget
            </Button>
            <Button size="lg" variant="outline" disabled>
              <Sparkle />
              Jackpot
              <Badge>Coming soon</Badge>
            </Button>
          </div>
        )}
        {assetType === 'token' && (
          <AssetTokenForm onComplete={handleOnComplete} />
        )}
        {assetType === 'gadget' && (
          <AssetGadgetForm onComplete={handleOnComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
};
