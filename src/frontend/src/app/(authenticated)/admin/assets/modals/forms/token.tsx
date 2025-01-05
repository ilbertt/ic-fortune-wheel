'use client';

import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DEFAULT_TOKENS, type DefaultTokensKey } from '@/constants/token';
import { useAuth } from '@/contexts/auth-context';
import type {
  CreateWheelAssetRequest,
  CreateWheelAssetTypeConfig,
  Err,
} from '@/declarations/backend/backend.did';
import { getLedgerActor } from '@/lib/ledger';
import type { ZodProperties } from '@/lib/types/utils';
import {
  candidOpt,
  fileFromBase64,
  fileFromUrl,
  renderError,
} from '@/lib/utils';
import { Actor } from '@dfinity/agent';
import { mapTokenMetadata } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtomValue } from 'jotai';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { wheelAssetToEdit } from '../../atoms';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import {
  existingWheelAssetImagesFiles,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { getDefaultToken, isDefaultToken } from '@/lib/token';
import {
  FormFooter,
  ImagesFormFields,
  PrizeFormFields,
  upsertImages,
} from './shared';

type AvailableTokens = DefaultTokensKey | 'custom';

type CreateAssetTokenFormSchemaType = Omit<
  CreateWheelAssetRequest,
  'asset_type_config'
> &
  Omit<
    Extract<CreateWheelAssetTypeConfig, { token: unknown }>['token'],
    'ledger_config' | 'exchange_rate_symbol'
  > & {
    exchange_rate_symbol: string | undefined;
  } & Extract<
    CreateWheelAssetTypeConfig,
    { token: unknown }
  >['token']['ledger_config'] & {
    modal_image_file: File | undefined;
    wheel_image_file: File | undefined;
  };

const createAssetTokenFormSchema = z.object<
  ZodProperties<CreateAssetTokenFormSchemaType>
>({
  name: z.string().min(1).max(100),
  ledger_canister_id: z.preprocess((val, ctx) => {
    try {
      return Principal.from(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not a valid principal',
      });

      // Special symbol to not affect the
      // inferred return type.
      return z.NEVER;
    }
  }, z.custom<Principal>()),
  decimals: z.coerce.number().min(0).max(20),
  exchange_rate_symbol: z.string().optional(),
  prize_usd_amount: z.number().min(0).max(500),
  total_amount: z.coerce.number().min(0).max(1_000),
  modal_image_file: z.instanceof(File).optional(),
  wheel_image_file: z.instanceof(File).optional(),
});

type AssetTokenFormProps = {
  onComplete: () => Promise<void>;
};

export const AssetTokenForm: React.FC<AssetTokenFormProps> = ({
  onComplete,
}) => {
  const existingWheelAsset = useAtomValue(
    wheelAssetToEdit,
  ) as WheelAssetToken | null;
  const isEdit = useMemo(
    () => Boolean(existingWheelAsset),
    [existingWheelAsset],
  );
  const { actor } = useAuth();
  const form = useForm<z.infer<typeof createAssetTokenFormSchema>>({
    resolver: zodResolver(createAssetTokenFormSchema),
    mode: 'onChange',
    defaultValues: existingWheelAsset
      ? async () => {
          const { wheelImageFile, modalImageFile } =
            await existingWheelAssetImagesFiles(existingWheelAsset);
          return {
            name: existingWheelAsset.name,
            total_amount: existingWheelAsset.total_amount,
            decimals:
              existingWheelAsset.asset_type.token.ledger_config.decimals,
            exchange_rate_symbol:
              existingWheelAsset.asset_type.token.exchange_rate_symbol[0],
            prize_usd_amount:
              existingWheelAsset.asset_type.token.prize_usd_amount,
            ledger_canister_id:
              existingWheelAsset.asset_type.token.ledger_config
                .ledger_canister_id,
            wheel_image_file: wheelImageFile,
            modal_image_file: modalImageFile,
          };
        }
      : undefined,
  });
  const [selectedToken, setSelectedToken] = useState<
    AvailableTokens | undefined
  >(
    existingWheelAsset
      ? getDefaultToken(
          existingWheelAsset.asset_type.token.ledger_config.ledger_canister_id,
        )?.[0] || 'custom'
      : undefined,
  );
  const [isFetchingTokenMetadata, setIsFetchingTokenMetadata] = useState(false);
  const formLedgerCanisterId = useWatch({
    control: form.control,
    name: 'ledger_canister_id',
  });
  const { toast } = useToast();

  const onSubmit = async (data: z.infer<typeof createAssetTokenFormSchema>) => {
    const prom = isEdit
      ? actor
          .update_wheel_asset({
            id: existingWheelAsset!.id,
            state: [],
            used_amount: [],
            name: candidOpt(data.name),
            total_amount: candidOpt(data.total_amount),
            asset_type_config: candidOpt({
              token: {
                prize_usd_amount: candidOpt(data.prize_usd_amount),
                exchange_rate_symbol: candidOpt(
                  data.exchange_rate_symbol || null,
                ),
                ledger_config: candidOpt({
                  decimals: candidOpt(data.decimals),
                }),
              },
            }),
          })
          .then(extractOk)
      : actor
          .create_wheel_asset({
            name: data.name,
            total_amount: data.total_amount,
            asset_type_config: {
              token: {
                ledger_config: {
                  ledger_canister_id: data.ledger_canister_id,
                  decimals: data.decimals,
                },
                exchange_rate_symbol: candidOpt(
                  data.exchange_rate_symbol || null,
                ),
                prize_usd_amount: data.prize_usd_amount,
              },
            },
          })
          .then(extractOk);

    await prom
      .then(async res =>
        upsertImages(
          data,
          actor,
          res ? res.id : existingWheelAsset!.id,
          existingWheelAsset,
        ),
      )
      .then(onComplete)
      .catch((e: Err) =>
        toast({
          title: `Error ${isEdit ? 'updating' : 'creating'} token asset`,
          description: renderError(e),
          variant: 'destructive',
        }),
      );
  };

  const onSelectToken = useCallback(
    async (token: AvailableTokens) => {
      setSelectedToken(token);

      if (token === 'custom') {
        const validationSettings = {
          shouldValidate: false,
          shouldDirty: true,
          shouldTouch: true,
        };
        // @ts-expect-error The form expects a principal
        form.setValue('ledger_canister_id', '', validationSettings);
        form.setValue('name', '', validationSettings);
        // @ts-expect-error The form expects a number
        form.setValue('decimals', '', validationSettings);
        form.setValue('exchange_rate_symbol', '', validationSettings);
      } else {
        const validationSettings = {
          shouldValidate: true,
          shouldDirty: true,
          shouldTouch: true,
        };
        const tokenData = DEFAULT_TOKENS[token as DefaultTokensKey];
        form.setValue(
          'ledger_canister_id',
          tokenData.ledger_config.ledger_canister_id,
          validationSettings,
        );
        form.setValue('name', tokenData.name, validationSettings);
        form.setValue(
          'decimals',
          tokenData.ledger_config.decimals,
          validationSettings,
        );
        form.setValue(
          'exchange_rate_symbol',
          tokenData.exchange_rate_symbol[0] || '',
          validationSettings,
        );

        if (tokenData.modalImageFileSrc) {
          const imageFile =
            (await fileFromUrl(tokenData.modalImageFileSrc)) || undefined;
          form.setValue('wheel_image_file', imageFile, validationSettings);
        }
      }
    },
    [form],
  );

  useEffect(() => {
    if (formLedgerCanisterId && !isEdit) {
      try {
        form.clearErrors('decimals');
        const ledgerCanisterId = Principal.from(formLedgerCanisterId);
        const isDefault = isDefaultToken(ledgerCanisterId);
        if (isDefault) {
          return;
        }
        const ledgerActor = getLedgerActor(
          ledgerCanisterId,
          Actor.agentOf(actor)!,
        );
        setIsFetchingTokenMetadata(true);
        ledgerActor
          .metadata({})
          .then(mapTokenMetadata)
          .then(async metadata => {
            if (!metadata) {
              return;
            }

            const validationSettings = {
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true,
            };
            form.setValue('name', metadata.symbol, validationSettings);
            form.setValue('decimals', metadata.decimals, validationSettings);

            if (metadata.icon) {
              const iconFile = fileFromBase64(metadata.icon, 'iconFile');
              form.setValue('wheel_image_file', iconFile, validationSettings);
            }
          })
          .catch(err => {
            console.error(err);
            form.setError('decimals', {
              type: 'custom',
              message: 'Failed to fetch token metadata',
            });
          })
          .finally(() => {
            setIsFetchingTokenMetadata(false);
          });
      } catch {
        // do nothing
      }
    }
  }, [formLedgerCanisterId, actor, form, isEdit]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Token Info</h2>
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select
                value={selectedToken}
                onValueChange={onSelectToken}
                disabled={isEdit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Token" />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(DEFAULT_TOKENS).map(token => (
                    <SelectItem key={`select-token-${token}`} value={token}>
                      {DEFAULT_TOKENS[token as DefaultTokensKey].name}
                    </SelectItem>
                  ))}
                  <SelectItem value="custom">Custom...</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <FormField
              control={form.control}
              name="ledger_canister_id"
              render={({ field: { value, ...field } }) => (
                <FormItem>
                  <FormLabel>Ledger Canister ID *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ledger Canister ID"
                      value={
                        value instanceof Principal
                          ? value.toText()
                          : value || ''
                      }
                      {...field}
                      disabled={isEdit}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isFetchingTokenMetadata ? 'Fetching...' : 'Name'
                      }
                      {...field}
                      disabled={isFetchingTokenMetadata}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="decimals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimals *</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder={
                        isFetchingTokenMetadata ? 'Fetching...' : 'Decimals'
                      }
                      {...field}
                      disabled={isFetchingTokenMetadata}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="exchange_rate_symbol"
              render={({ field }) => (
                <FormItem className="col-span-full">
                  <FormLabel>Exchange Rate Symbol</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='E.g. Use "BTC" for "ckBTC"'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Used to fetch the USD exchange rate from the{' '}
                    <a
                      href="https://github.com/dfinity/exchange-rate-canister"
                      target="_blank"
                      className="text-indaco-blue underline"
                    >
                      XRC canister
                    </a>
                    . Leave blank to not fetch the exchange rate.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        <ImagesFormFields />
        <PrizeFormFields />
        <FormFooter isEdit={isEdit} onComplete={onComplete} />
      </form>
    </Form>
  );
};
