'use client';

import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  AlertDialogCancel,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { CurrencyInput, Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TransferTokenRequest } from '@/declarations/backend/backend.did';
import { useLedgerCanisterMetadata } from '@/hooks/use-ledger-canister-metadata';
import { PrincipalSchema } from '@/lib/forms';
import type { ZodProperties } from '@/lib/types/utils';
import { bigIntToFloat, floatToBigInt, renderUsdValue } from '@/lib/utils';
import {
  wheelAssetBalance,
  wheelAssetTokenTotalUsdValue,
} from '@/lib/wheel-asset';
import { Principal } from '@dfinity/principal';
import { zodResolver } from '@hookform/resolvers/zod';
import { Send } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { useTransferToken } from '@/hooks/use-transfer-token';

const transferTokenFormSchema = z.object<
  ZodProperties<
    Omit<TransferTokenRequest, 'amount'> & {
      amount: number;
    }
  >
>({
  ledger_canister_id: PrincipalSchema,
  to: PrincipalSchema,
  amount: z.coerce.number().min(0),
});

export const SendTokenModal = () => {
  const { tokenAssets } = useWheelAssetTokens();
  const { mutateAsync: transferToken, isPending: isTransferring } =
    useTransferToken();
  const form = useForm<z.infer<typeof transferTokenFormSchema>>({
    resolver: zodResolver(transferTokenFormSchema),
    mode: 'onChange',
  });
  const { isValid: isFormValid, isSubmitting: isFormSubmitting } =
    form.formState;
  const formLedgerCanisterId = useWatch({
    control: form.control,
    name: 'ledger_canister_id',
  });
  const selectedTokenAsset = useMemo(() => {
    if (formLedgerCanisterId) {
      return tokenAssets.find(
        el =>
          el.asset_type.token.ledger_config.ledger_canister_id.compareTo(
            Principal.from(formLedgerCanisterId),
          ) === 'eq',
      );
    }
    return null;
  }, [tokenAssets, formLedgerCanisterId]);
  const selectedTokenAssetDecimals =
    selectedTokenAsset?.asset_type.token.ledger_config.decimals;
  const tokenName = selectedTokenAsset?.name || '';
  const { ledgerCanisterMetadata, isFetchingLedgerCanisterMetadata } =
    useLedgerCanisterMetadata({
      ledgerCanisterId: formLedgerCanisterId,
    });
  const ledgerCanisterFee =
    ledgerCanisterMetadata && selectedTokenAssetDecimals
      ? bigIntToFloat(ledgerCanisterMetadata.fee, selectedTokenAssetDecimals)
      : null;
  const [open, setOpen] = useState(false);

  const handleMaxAmountClick = useCallback(() => {
    if (selectedTokenAsset && ledgerCanisterFee) {
      const balance = wheelAssetBalance(selectedTokenAsset);
      const newAmount = balance - ledgerCanisterFee;
      // workaround
      form.setValue('amount', newAmount.toString() as unknown as number, {
        shouldValidate: true,
      });
    }
  }, [selectedTokenAsset, form, ledgerCanisterFee]);

  const handleOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        form.reset();
      }
      setOpen(open);
    },
    [form],
  );

  const onSubmit = async (data: z.infer<typeof transferTokenFormSchema>) => {
    if (!selectedTokenAssetDecimals) {
      return;
    }
    const amount = floatToBigInt(data.amount, selectedTokenAssetDecimals);
    await transferToken({
      ledger_canister_id: data.ledger_canister_id,
      to: data.to,
      amount,
    });
    form.reset();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger asChild>
        <Button variant="outline">
          <Send />
          Send
        </Button>
      </AlertDialogTrigger>
      <Form {...form}>
        <AlertDialogContent asChild>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <AlertDialogHeader>
              <AlertDialogTitle>Send tokens</AlertDialogTitle>
              <AlertDialogDescription>
                Transfer tokens to a principal of your choice.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="space-y-2">
              <FormField
                control={form.control}
                name="ledger_canister_id"
                render={({ field }) => {
                  const principalText =
                    field.value && field.value instanceof Principal
                      ? field.value.toText()
                      : field.value;

                  return (
                    <FormItem>
                      <FormLabel>Token *</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={principalText}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a token" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {tokenAssets.map(tokenAsset => (
                            <SelectItem
                              key={tokenAsset.asset_type.token.ledger_config.ledger_canister_id.toText()}
                              value={tokenAsset.asset_type.token.ledger_config.ledger_canister_id.toText()}
                            >
                              {tokenAsset.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTokenAsset && (
                        <FormDescription>
                          Balance: {wheelAssetBalance(selectedTokenAsset)} (
                          {renderUsdValue(
                            wheelAssetTokenTotalUsdValue(selectedTokenAsset),
                          )}
                          )
                          <br />
                          Ledger canister ID: {principalText}
                          <br />
                        </FormDescription>
                      )}
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="to"
                render={({ field: { value, ...field } }) => (
                  <FormItem>
                    <FormLabel>To *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="A valid principal"
                        value={
                          value instanceof Principal
                            ? value.toText()
                            : value || ''
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Amount *
                      {selectedTokenAsset && (
                        <Button
                          variant="link"
                          className="ml-4 h-auto p-0 underline"
                          onClick={handleMaxAmountClick}
                          loading={isFetchingLedgerCanisterMetadata}
                          disabled={isFormSubmitting}
                        >
                          Max
                        </Button>
                      )}
                    </FormLabel>
                    <FormControl>
                      <CurrencyInput
                        currency={tokenName}
                        formatOptions={{
                          minimumFractionDigits: selectedTokenAssetDecimals,
                          maximumFractionDigits: selectedTokenAssetDecimals,
                        }}
                        {...field}
                      />
                    </FormControl>
                    {ledgerCanisterFee && (
                      <FormDescription>
                        Fee: {ledgerCanisterFee} {tokenName}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <Button
                type="submit"
                loading={isFormSubmitting || isTransferring}
                disabled={!isFormValid}
              >
                Send
              </Button>
            </AlertDialogFooter>
          </form>
        </AlertDialogContent>
      </Form>
    </AlertDialog>
  );
};
