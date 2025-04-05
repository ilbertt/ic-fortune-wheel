import type {
  CreateWheelAssetRequest,
  CreateWheelAssetTypeConfig,
  Err,
} from '@/declarations/backend/backend.did';
import {
  AssetNameSchema,
  AssetTotalAmountSchema,
  OptionalFileSchema,
} from '@/lib/forms';
import { ZodProperties } from '@/lib/types/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAtomValue } from 'jotai';
import { useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';
import { wheelAssetToEdit } from '../../atoms';
import {
  existingWheelAssetImagesFiles,
  type WheelAssetToken,
  wheelAssetUrl,
  type WheelAssetJackpot,
  wheelAssetTokensPrizeUsdSum,
} from '@/lib/wheel-asset';
import { useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { useCreateWheelAsset } from '@/hooks/use-create-wheel-asset';
import { useUpsertWheelAssetImages } from '@/hooks/use-upsert-wheel-asset-images';
import { fileFromUrl, renderError, renderUsdValue } from '@/lib/utils';
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
import { FormFooter, ImagesFormFields, PrizeFormFields } from './shared';
import { useWheelAssetTokens } from '@/hooks/use-wheel-asset-tokens';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CircleDollarSign } from 'lucide-react';
import { WHEEL_ASSET_DEFAULT_IMAGES } from '@/constants/images';

type CreateAssetJackpotFormSchemaType = Omit<
  CreateWheelAssetRequest,
  'asset_type_config' | 'wheel_ui_settings'
> &
  Extract<CreateWheelAssetTypeConfig, { jackpot: unknown }>['jackpot'] & {
    modal_image_file: File | undefined;
    wheel_image_file: File | undefined;
  };

const createAssetJackpotFormSchema = z.object<
  ZodProperties<CreateAssetJackpotFormSchemaType>
>({
  name: AssetNameSchema,
  total_amount: AssetTotalAmountSchema,
  wheel_asset_ids: z
    .array(z.string().uuid())
    .min(2, 'At least two tokens are required'),
  modal_image_file: OptionalFileSchema,
  wheel_image_file: OptionalFileSchema,
});

type FormSchema = z.infer<typeof createAssetJackpotFormSchema>;

type AssetJackpotFormProps = {
  onComplete: () => Promise<void>;
};

export const AssetJackpotForm: React.FC<AssetJackpotFormProps> = ({
  onComplete,
}) => {
  const existingWheelAsset = useAtomValue(
    wheelAssetToEdit,
  ) as WheelAssetJackpot | null;
  const isEdit = useMemo(
    () => Boolean(existingWheelAsset),
    [existingWheelAsset],
  );
  const form = useForm<FormSchema>({
    resolver: zodResolver(createAssetJackpotFormSchema),
    mode: 'onChange',
    defaultValues: async () => {
      if (existingWheelAsset) {
        const { wheelImageFile, modalImageFile } =
          await existingWheelAssetImagesFiles(existingWheelAsset);
        return {
          name: existingWheelAsset.name,
          total_amount: existingWheelAsset.total_amount,
          wheel_asset_ids:
            existingWheelAsset.asset_type.jackpot.wheel_asset_ids ?? [],
          wheel_image_file: wheelImageFile,
          modal_image_file: modalImageFile,
        };
      }
      return {
        wheel_asset_ids: [],
        wheel_image_file:
          (await fileFromUrl(WHEEL_ASSET_DEFAULT_IMAGES.JACKPOT.WHEEL)) ||
          undefined,
        modal_image_file: undefined,
      } satisfies Partial<FormSchema> as unknown as FormSchema;
    },
  });
  const wheelAssetIdsFormValue = useWatch({
    control: form.control,
    name: 'wheel_asset_ids',
    defaultValue: [],
  });
  const { toast } = useToast();
  const updateWheelAssetMutation = useUpdateWheelAsset();
  const createWheelAssetMutation = useCreateWheelAsset();
  const upsertWheelAssetImagesMutation = useUpsertWheelAssetImages();
  const { tokenAssets } = useWheelAssetTokens();

  const getSelectedTokenAssets = (ids: string[]): WheelAssetToken[] =>
    tokenAssets.filter(t => ids.includes(t.id));

  const onSubmit = async (data: FormSchema) => {
    const prom = isEdit
      ? updateWheelAssetMutation.mutateAsync({
          id: existingWheelAsset!.id,
          name: data.name,
          total_amount: data.total_amount,
          asset_type_config: {
            jackpot: {
              wheel_asset_ids: data.wheel_asset_ids,
            },
          },
        })
      : createWheelAssetMutation.mutateAsync({
          name: data.name,
          total_amount: data.total_amount,
          asset_type_config: {
            jackpot: {
              wheel_asset_ids: data.wheel_asset_ids,
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
        const title = `Error ${isEdit ? 'updating' : 'creating'} gadget asset`;
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-2">
          <h2 className="text-lg font-medium">Jackpot Configuration</h2>
          <div className="flex flex-col gap-4">
            <FormField
              control={form.control}
              name="wheel_asset_ids"
              render={() => (
                <FormItem className="space-y-3">
                  <div className="mb-4">
                    <FormLabel>Tokens *</FormLabel>
                    <FormDescription>
                      Select the tokens you want to give away in the jackpot
                      extraction. They are all given away in the same draw.
                    </FormDescription>
                  </div>
                  {tokenAssets.map(tokenAsset => (
                    <FormField
                      key={tokenAsset.id}
                      control={form.control}
                      name="wheel_asset_ids"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={tokenAsset.id}
                            className="flex flex-row items-center gap-2 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(tokenAsset.id)}
                                onCheckedChange={checked => {
                                  const newValue = checked
                                    ? [...field.value, tokenAsset.id]
                                    : field.value.filter(
                                        value => value !== tokenAsset.id,
                                      );
                                  if (
                                    newValue.length > 0 &&
                                    !isEdit &&
                                    !form.getFieldState('name').isDirty
                                  ) {
                                    form.setValue(
                                      'name',
                                      getSelectedTokenAssets(newValue)
                                        .map(t => t.name)
                                        .join(', '),
                                      {
                                        shouldDirty: false,
                                        shouldValidate: true,
                                      },
                                    );
                                  }
                                  return field.onChange(newValue);
                                }}
                                disabled={
                                  tokenAsset.asset_type.token
                                    .available_draws_count === 0
                                }
                              />
                            </FormControl>
                            <FormLabel className="flex flex-row items-center gap-2">
                              <Avatar className="size-6">
                                <AvatarImage
                                  src={wheelAssetUrl(
                                    tokenAsset.wheel_image_path,
                                  )}
                                />
                                <AvatarFallback>
                                  <CircleDollarSign />
                                </AvatarFallback>
                              </Avatar>
                              <div className="font-medium">
                                {tokenAsset.name} (
                                {renderUsdValue(
                                  tokenAsset.asset_type.token.prize_usd_amount,
                                )}
                                , available draws:{' '}
                                {tokenAsset.asset_type.token.available_draws_count.toLocaleString()}
                                )
                              </div>
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                  <p className="text-sm">
                    Total jackpot amount:{' '}
                    {renderUsdValue(
                      wheelAssetTokensPrizeUsdSum(
                        getSelectedTokenAssets(wheelAssetIdsFormValue),
                      ),
                    )}
                  </p>
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
                    <Input placeholder="Name" {...field} />
                  </FormControl>
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
