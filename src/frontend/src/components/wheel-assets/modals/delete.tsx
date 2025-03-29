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
import { useDeleteWheelAsset } from '@/hooks/use-delete-wheel-asset';
import { isWheelAssetToken } from '@/lib/wheel-asset';
import { useAtomValue } from 'jotai';
import { useMemo, useState } from 'react';
import { wheelAssetToEdit } from '../atoms';

type DeleteAssetModalProps = {
  onDeleteComplete: () => Promise<void>;
};

export const DeleteAssetModal: React.FC<DeleteAssetModalProps> = ({
  onDeleteComplete,
}) => {
  const asset = useAtomValue(wheelAssetToEdit);
  const [open, setOpen] = useState(false);
  const canDelete = useMemo(() => !isWheelAssetToken(asset!), [asset]);
  const { mutateAsync: deleteAsset, isPending: isDeleting } =
    useDeleteWheelAsset();

  const onDelete = async () => {
    await deleteAsset(asset!.id);
    onDeleteComplete();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive">Delete</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {asset!.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            {canDelete ? (
              <>
                Are you sure you want to delete {asset!.name}? This action
                cannot be undone.
              </>
            ) : (
              <>
                The {asset!.name} asset
                {isWheelAssetToken(asset!) ? ' is a token and' : ''} cannot be
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
