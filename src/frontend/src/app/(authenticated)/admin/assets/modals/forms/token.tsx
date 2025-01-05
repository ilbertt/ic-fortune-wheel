'use client';

import { InputNumberControls } from '@/components/input-number-controls';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
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
  UpdateWheelAssetImageConfig,
} from '@/declarations/backend/backend.did';
import { getLedgerActor } from '@/lib/ledger';
import type { ZodProperties } from '@/lib/types/utils';
import {
  candidOpt,
  fileFromBase64,
  fileFromUrl,
  formatBytes,
  getDecimalSeparator,
  localFileToSrc,
  renderError,
} from '@/lib/utils';
import { Actor } from '@dfinity/agent';
import { mapTokenMetadata } from '@dfinity/ledger-icrc';
import { Principal } from '@dfinity/principal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { createAssetTypeAtom } from '../atoms';
import { ChevronLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import Image from 'next/image';
import { FileInput } from '@/components/file-input';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const IMAGE_ACCEPT_MIME_TYPES = ['image/png', 'image/svg+xml'];

const BackButton = () => {
  const [assetType, setAssetType] = useAtom(createAssetTypeAtom);

  if (!assetType) {
    return null;
  }

  return (
    <Button
      variant="ghost"
      onClick={() => setAssetType(null)}
      className="sm:self-left [&>svg]:text-indaco-blue h-fit sm:w-fit sm:py-1 sm:pl-0 sm:pr-1"
    >
      <ChevronLeft />
      Back
    </Button>
  );
};

type AvailableTokens = DefaultTokensKey & 'custom';

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
  ledger_canister_id: z.string().transform((val, ctx) => {
    try {
      return Principal.fromText(val);
    } catch {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Not a valid principal',
      });

      // Special symbol to not affect the
      // inferred return type.
      return z.NEVER;
    }
  }),
  decimals: z.number().min(0).max(20),
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
  const { actor } = useAuth();
  const form = useForm<z.infer<typeof createAssetTokenFormSchema>>({
    resolver: zodResolver(createAssetTokenFormSchema),
    mode: 'onChange',
  });
  const [selectedToken, setSelectedToken] = useState<AvailableTokens>();
  const [isFetchingTokenMetadata, setIsFetchingTokenMetadata] = useState(false);
  const formLedgerCanisterId = useWatch({
    control: form.control,
    name: 'ledger_canister_id',
  });
  const { isValid: isFormValid, isSubmitting: isFormSubmitting } =
    form.formState;
  const { toast } = useToast();

  const onSubmit = async (data: z.infer<typeof createAssetTokenFormSchema>) => {
    await actor
      .create_wheel_asset({
        name: data.name,
        total_amount: data.total_amount,
        asset_type_config: {
          token: {
            ledger_config: {
              ledger_canister_id: data.ledger_canister_id,
              decimals: data.decimals,
            },
            exchange_rate_symbol: candidOpt(data.exchange_rate_symbol || null),
            prize_usd_amount: data.prize_usd_amount,
          },
        },
      })
      .then(extractOk)
      .then(async res => {
        const toUpdate: UpdateWheelAssetImageConfig[] = [];
        if (data.wheel_image_file instanceof File) {
          toUpdate.push({
            wheel: {
              content_type: data.wheel_image_file.type,
              content_bytes: new Uint8Array(
                await data.wheel_image_file.arrayBuffer(),
              ),
            },
          });
        }
        if (data.modal_image_file instanceof File) {
          toUpdate.push({
            modal: {
              content_type: data.modal_image_file.type,
              content_bytes: new Uint8Array(
                await data.modal_image_file.arrayBuffer(),
              ),
            },
          });
        }

        return Promise.all(
          toUpdate.map(config =>
            actor
              .update_wheel_asset_image({
                id: res.id,
                image_config: config,
              })
              .then(extractOk),
          ),
        );
      })
      .then(onComplete)
      .catch((e: Err) =>
        toast({
          title: 'Error creating token asset',
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
          // @ts-expect-error The form expects a principal
          tokenData.ledger_config.ledger_canister_id.toText(),
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
          const imageFile = await fileFromUrl(tokenData.modalImageFileSrc);
          form.setValue('wheel_image_file', imageFile, validationSettings);
        }
      }
    },
    [form],
  );

  useEffect(() => {
    if (formLedgerCanisterId) {
      try {
        form.clearErrors('decimals');
        const ledgerCanisterId = Principal.from(formLedgerCanisterId);
        const isDefaultToken = Object.values(DEFAULT_TOKENS).some(
          token =>
            token.ledger_config.ledger_canister_id.compareTo(
              ledgerCanisterId,
            ) === 'eq',
        );
        if (isDefaultToken) {
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
  }, [formLedgerCanisterId, actor, form]);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Token Info</h2>
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-[180px_1fr]">
            <div className="space-y-2">
              <Label>Token</Label>
              <Select value={selectedToken} onValueChange={onSelectToken}>
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
                  <FormLabel>Ledger Canister ID</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ledger Canister ID"
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
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input
                      disabled={isFetchingTokenMetadata}
                      placeholder={
                        isFetchingTokenMetadata ? 'Fetching...' : 'Name'
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
              name="decimals"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Decimals</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      disabled={isFetchingTokenMetadata}
                      placeholder={
                        isFetchingTokenMetadata ? 'Fetching...' : 'Decimals'
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
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Images</h2>
          <div className="my-4 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col items-center justify-start">
              <h2 className="text-md font-semibold">
                Wheel Image (max. {formatBytes(MAX_IMAGE_SIZE_BYTES)})
              </h2>
              <FormField
                control={form.control}
                name="wheel_image_file"
                render={({ field }) => (
                  <>
                    <Image
                      className="my-4 h-[100px] object-contain"
                      src={localFileToSrc(
                        field.value ?? null,
                        '/images/wheel-item-placeholder.png',
                      )}
                      alt="Wheel image"
                      width={100}
                      height={100}
                    />
                    <FileInput
                      buttonText="Update"
                      onChange={field.onChange}
                      acceptMimeTypes={IMAGE_ACCEPT_MIME_TYPES}
                      maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
                    />
                  </>
                )}
              />
            </div>
            <div className="flex flex-col items-center justify-start">
              <h2 className="text-md font-semibold">
                Modal Image (max. {formatBytes(MAX_IMAGE_SIZE_BYTES)})
              </h2>
              <FormField
                control={form.control}
                name="modal_image_file"
                render={({ field }) => (
                  <>
                    <Image
                      className="my-4 h-[100px] object-contain"
                      src={localFileToSrc(
                        field.value ?? null,
                        '/images/wheel-modal-placeholder.png',
                      )}
                      alt="Modal image"
                      width={178}
                      height={100}
                    />
                    <FileInput
                      buttonText="Update"
                      onChange={field.onChange}
                      acceptMimeTypes={IMAGE_ACCEPT_MIME_TYPES}
                      maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
                    />
                  </>
                )}
              />
            </div>
            <div className="col-span-full">
              <p className="text-muted-foreground text-xs">
                <b>Tip:</b> you can use online tools like{' '}
                <a
                  href="https://tinypng.com/"
                  target="_blank"
                  className="text-indaco-blue underline"
                >
                  Tinify
                </a>{' '}
                to reduce the image size while preserving quality.
              </p>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Prize</h2>
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-2">
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
          </div>
        </div>
        <DialogFooter className="sm:items-center sm:justify-between">
          <BackButton />
          <Button
            type="submit"
            variant="secondary"
            loading={isFormSubmitting}
            disabled={!isFormValid}
          >
            Add Token
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
};
