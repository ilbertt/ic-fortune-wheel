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
import { createAssetTypeAtom } from '../atoms';

type CreateAssetModalProps = {
  onComplete: () => Promise<void>;
};

export const CreateAssetModal: React.FC<CreateAssetModalProps> = ({
  onComplete,
}) => {
  const [open, setOpen] = useState(false);
  const [assetType, setAssetType] = useAtom(createAssetTypeAtom);

  const handleOnComplete = useCallback(async () => {
    await onComplete();
    setOpen(false);
  }, [onComplete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle />
          Add Asset
        </Button>
      </DialogTrigger>
      <DialogContent>
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
      </DialogContent>
    </Dialog>
  );
};
