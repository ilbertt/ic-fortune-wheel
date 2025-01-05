'use client';

import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogAction,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { backendCanisterId } from '@/constants/api';
import { Coins } from 'lucide-react';

export const TopUpModal = () => {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Coins />
          Top-up
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Top up tokens balances</AlertDialogTitle>
          <AlertDialogDescription>
            Send one or more of the tokens available in the assets to the
            backend&apos;s canister principal:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-row flex-wrap items-center justify-center gap-2">
          <pre>{backendCanisterId.toText()}</pre>
          <CopyToClipboardButton value={backendCanisterId.toText()} />
        </div>
        <AlertDialogFooter>
          <AlertDialogAction>I understand</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
