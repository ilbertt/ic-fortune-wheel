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
import { useAuth } from '@/contexts/auth-context';
import { PlusCircle } from 'lucide-react';

export const TopUpModal = () => {
  const { backendCanisterId } = useAuth();

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <PlusCircle />
          Top-up
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Top up balance</AlertDialogTitle>
          <AlertDialogDescription>
            Send one or more of the tokens available in the assets to the
            backend principal:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="flex flex-row flex-wrap items-center gap-2">
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
