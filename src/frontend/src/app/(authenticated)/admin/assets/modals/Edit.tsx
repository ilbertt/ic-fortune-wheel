'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import type { WheelAsset } from '@/declarations/backend/backend.did';
import { Settings2 } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useAtom } from 'jotai';
import { wheelAssetToEdit } from '../atoms';
import { AssetTokenForm } from './forms/token';
import { isWheelAssetGadget, isWheelAssetToken } from '@/lib/wheel-asset';
import { AssetGadgetForm } from './forms/gadget';
import { useWheelAssets } from '@/contexts/wheel-assets-context';

type EditAssetModalProps = {
  asset: WheelAsset;
};

export const EditAssetModal: React.FC<EditAssetModalProps> = ({ asset }) => {
  const { fetchAssets } = useWheelAssets();
  const [open, setOpen] = useState(false);
  const [selectedAsset, setWheelAssetToEdit] = useAtom(wheelAssetToEdit);

  const handleOnOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        setWheelAssetToEdit(null);
      } else {
        setWheelAssetToEdit(asset);
      }
      setOpen(open);
    },
    [asset, setWheelAssetToEdit],
  );

  const handleOnComplete = useCallback(async () => {
    await fetchAssets();
    handleOnOpenChange(false);
  }, [fetchAssets, handleOnOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleOnOpenChange} modal>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-indaco-blue">
          <Settings2 className="stroke-current" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit {asset.name}</DialogTitle>
          <DialogDescription>
            Edit the configuration of {asset.name}.
          </DialogDescription>
        </DialogHeader>
        {selectedAsset && isWheelAssetToken(selectedAsset) && (
          <AssetTokenForm onComplete={handleOnComplete} />
        )}
        {selectedAsset && isWheelAssetGadget(selectedAsset) && (
          <AssetGadgetForm onComplete={handleOnComplete} />
        )}
      </DialogContent>
    </Dialog>
  );
};
