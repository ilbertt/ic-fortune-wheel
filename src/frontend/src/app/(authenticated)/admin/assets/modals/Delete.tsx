'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import type { Err, WheelAsset } from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { renderError } from '@/lib/utils';
import { isWheelAssetToken } from '@/lib/wheel-asset';
import { useMemo, useState } from 'react';

type DeleteAssetModalProps = {
  asset: WheelAsset;
  onDeleteComplete: () => Promise<void>;
};

export const DeleteAssetModal: React.FC<DeleteAssetModalProps> = ({
  asset,
  onDeleteComplete,
}) => {
  const { actor } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const canDelete = useMemo(() => !isWheelAssetToken(asset), [asset]);

  const onDelete = async () => {
    setIsDeleting(true);
    await actor
      .delete_wheel_asset({ id: asset.id })
      .then(extractOk)
      .then(onDeleteComplete)
      .then(() => {
        setOpen(false);
      })
      .catch((e: Err) =>
        toast({
          title: 'Error deleting asset',
          description: renderError(e),
          variant: 'destructive',
        }),
      )
      .finally(() => {
        setIsDeleting(false);
      });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {asset.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Are you sure you want to delete {asset.name}? This action cannot
                be undone.
              </>
            ) : (
              <>
                The {asset.name} asset
                {isWheelAssetToken(asset) ? ' is a token and' : ''} cannot be
                deleted.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            asChild
            className={buttonVariants({ variant: 'destructive' })}
          >
            <Button
              loading={isDeleting}
              onClick={onDelete}
              disabled={!canDelete}
            >
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
