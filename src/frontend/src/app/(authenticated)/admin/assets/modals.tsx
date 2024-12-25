'use client';

import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';
import { InputNumberControls } from '@/components/input-number-controls';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CurrencyInput, Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/auth-context';
import type {
  Err,
  UpdateWheelAssetTypeConfig,
  WheelAsset,
} from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { candidOpt, getDecimalSeparator, renderError } from '@/lib/utils';
import { isWheelAssetToken } from '@/lib/wheelAsset';
import { zodResolver } from '@hookform/resolvers/zod';
import { Coins, Settings2 } from 'lucide-react';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

export const TopUpModal = () => {
  const { backendCanisterId } = useAuth();

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

const editAssetFormSchema = z.object({
  total_amount: z.coerce.number().min(0).max(1_000),
  prize_usd_amount: z.number().min(0).max(500).optional(),
});

type EditAssetModalProps = {
  asset: WheelAsset;
  onEditComplete: () => Promise<void>;
};

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  asset,
  onEditComplete,
}) => {
  const { actor } = useAuth();
  const form = useForm<z.infer<typeof editAssetFormSchema>>({
    resolver: zodResolver(editAssetFormSchema),
    mode: 'onChange',
    defaultValues: {
      total_amount: asset.total_amount,
      prize_usd_amount: isWheelAssetToken(asset)
        ? asset.asset_type.token.prize_usd_amount
        : undefined,
    },
  });
  const { isValid: isFormValid, isSubmitting: isFormSubmitting } =
    form.formState;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: z.infer<typeof editAssetFormSchema>) => {
    const assetTypeConfig = (
      isWheelAssetToken(asset)
        ? {
            token: {
              prize_usd_amount: candidOpt(data.prize_usd_amount),
            },
          }
        : undefined
    ) satisfies UpdateWheelAssetTypeConfig | undefined;

    await actor
      .update_wheel_asset({
        id: asset.id,
        total_amount: candidOpt(data.total_amount),
        name: [],
        state: [],
        used_amount: [],
        asset_type_config: candidOpt(assetTypeConfig),
      })
      .then(extractOk)
      .then(onEditComplete)
      .then(() => {
        setOpen(false);
      })
      .catch((e: Err) =>
        toast({
          title: 'Error updating asset',
          description: renderError(e),
          variant: 'destructive',
        }),
      );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="my-4 grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="total_amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prize Quantity</FormLabel>
                    <FormControl>
                      <div className="flex flex-row flex-wrap items-center justify-start gap-1.5 md:flex-nowrap">
                        <Input
                          type="number"
                          className="w-32"
                          placeholder="100"
                          {...field}
                        />
                        <InputNumberControls />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {isWheelAssetToken(asset) && (
                <FormField
                  control={form.control}
                  name="prize_usd_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize Value</FormLabel>
                      <FormControl>
                        <CurrencyInput
                          currency="$"
                          placeholder={`1${getDecimalSeparator()}00`}
                          className="w-32"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            <DialogFooter>
              <Button
                type="submit"
                variant="secondary"
                loading={isFormSubmitting}
                disabled={!isFormValid}
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
