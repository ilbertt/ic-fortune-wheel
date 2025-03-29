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
import type {
  CreateWheelAssetRequest,
  CreateWheelAssetTypeConfig,
  Err,
} from '@/declarations/backend/backend.did';
import type { ZodProperties } from '@/lib/types/utils';
import {
  candidOpt,
  fileFromBase64,
  fileFromUrl,
  renderError,
} from '@/lib/utils';
import { Principal } from '@dfinity/principal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtomValue } from 'jotai';
import { useCallback, useMemo, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { wheelAssetToEdit } from '../../atoms';
import { useToast } from '@/hooks/use-toast';
import {
  existingWheelAssetImagesFiles,
  type WheelAssetToken,
} from '@/lib/wheel-asset';
import { getDefaultToken, isDefaultToken } from '@/lib/token';
import {
  FormFooter,
  ImagesFormFields,
  type ImagesFormFieldsProps,
  PrizeFormFields,
} from './shared';
import {
  PrincipalSchema,
  AssetTotalAmountSchema,
  OptionalFileSchema,
  AssetNameSchema,
} from '@/lib/forms';
import { useLedgerCanisterMetadata } from '@/hooks/use-ledger-canister-metadata';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { useCreateWheelAsset } from '@/hooks/use-create-wheel-asset';
import { useUpsertWheelAssetImages } from '@/hooks/use-upsert-wheel-asset-images';

type AvailableTokens = DefaultTokensKey | 'custom';

type CreateAssetTokenFormSchemaType = Omit<
  CreateWheelAssetRequest,
  'asset_type_config' | 'wheel_ui_settings'
> &
  Omit<
    Extract<CreateWheelAssetTypeConfig, { token: unknown }>['token'],
    'ledger_config' | 'exchange_rate_symbol'
  > & {
    exchange_rate_symbol: string | undefined;
  } & Extract<
    CreateWheelAssetTypeConfig,
    { token: unknown }
  >['token']['ledger_config'] &
  ImagesFormFieldsProps;

const createAssetTokenFormSchema = z.object<
  ZodProperties<CreateAssetTokenFormSchemaType>
>({
  name: AssetNameSchema,
  ledger_canister_id: PrincipalSchema,
  decimals: z.coerce.number().min(0).max(20),
  exchange_rate_symbol: z.string().optional(),
  prize_usd_amount: z.number().min(0.5).max(500),
  total_amount: AssetTotalAmountSchema,
  modal_image_file: OptionalFileSchema,
  wheel_image_file: OptionalFileSchema,
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
  const formLedgerCanisterId = useWatch({
    control: form.control,
    name: 'ledger_canister_id',
  });
  const { isFetchingLedgerCanisterMetadata } = useLedgerCanisterMetadata({
    ledgerCanisterId:
      !isEdit && formLedgerCanisterId && !isDefaultToken(formLedgerCanisterId)
        ? formLedgerCanisterId
        : undefined,
    onSuccess: metadata => {
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
    },
    onError: () => {
      form.setError('decimals', {
        type: 'custom',
        message: 'Failed to fetch token metadata',
      });
    },
  });
  const { toast } = useToast();
  const updateWheelAssetMutation = useUpdateWheelAsset();
  const createWheelAssetMutation = useCreateWheelAsset();
  const upsertWheelAssetImagesMutation = useUpsertWheelAssetImages();

  const onSubmit = async (data: z.infer<typeof createAssetTokenFormSchema>) => {
    const prom = isEdit
      ? updateWheelAssetMutation.mutateAsync({
          id: existingWheelAsset!.id,
          name: data.name,
          total_amount: data.total_amount,
          asset_type_config: {
            token: {
              prize_usd_amount: candidOpt(data.prize_usd_amount),
              exchange_rate_symbol: candidOpt(
                data.exchange_rate_symbol || null,
              ),
              ledger_config: candidOpt({
                decimals: candidOpt(data.decimals),
              }),
            },
          },
        })
      : createWheelAssetMutation.mutateAsync({
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
        });

    await prom
      .then(async res =>
        upsertWheelAssetImagesMutation.mutateAsync({
          wheelAssetId: res ? res.id : existingWheelAsset!.id,
          existingWheelAsset,
          wheelImageFile: data.wheel_image_file,
          modalImageFile: data.modal_image_file,
        }),
      )
      .then(onComplete)
      .catch((e: Err) => {
        const title = `Error ${isEdit ? 'updating' : 'creating'} token asset`;
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      });
  };

  const onSelectToken = useCallback(
    async (token: AvailableTokens) => {
      setSelectedToken(token);
      form.clearErrors('decimals');

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
        form.setValue('wheel_image_file', undefined, validationSettings);
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
                        isFetchingLedgerCanisterMetadata
                          ? 'Fetching...'
                          : 'Name'
                      }
                      {...field}
                      disabled={isFetchingLedgerCanisterMetadata}
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
                        isFetchingLedgerCanisterMetadata
                          ? 'Fetching...'
                          : 'Decimals'
                      }
                      {...field}
                      disabled={isFetchingLedgerCanisterMetadata}
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
