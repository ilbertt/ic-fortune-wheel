import type {
  CreateWheelAssetRequest,
  Err,
} from '@/declarations/backend/backend.did';
import type { ZodProperties } from '@/lib/types/utils';
import { useAtomValue } from 'jotai';
import { z } from 'zod';
import { wheelAssetToEdit } from '../../atoms';
import { useMemo } from 'react';
import {
  existingWheelAssetImagesFiles,
  type WheelAssetGadget,
} from '@/lib/wheel-asset';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { candidOpt, renderError } from '@/lib/utils';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  FormFooter,
  ImagesFormFields,
  type ImagesFormFieldsProps,
  PrizeFormFields,
} from './shared';
import { useUpdateWheelAsset } from '@/hooks/use-update-wheel-asset';
import { useCreateWheelAsset } from '@/hooks/use-create-wheel-asset';
import { useUpsertWheelAssetImages } from '@/hooks/use-upsert-wheel-asset-images';
import {
  AssetNameSchema,
  AssetTotalAmountSchema,
  OptionalFileSchema,
} from '@/lib/forms';

type CreateAssetGadgetFormSchemaType = Omit<
  CreateWheelAssetRequest,
  'asset_type_config' | 'wheel_ui_settings'
> & {
  article_type: string | undefined;
} & ImagesFormFieldsProps;

const createAssetGadgetFormSchema = z.object<
  ZodProperties<CreateAssetGadgetFormSchemaType>
>({
  name: AssetNameSchema,
  total_amount: AssetTotalAmountSchema,
  article_type: z.string().optional(),
  modal_image_file: OptionalFileSchema,
  wheel_image_file: OptionalFileSchema,
});

type AssetGadgetFormProps = {
  onComplete: () => Promise<void>;
};

export const AssetGadgetForm: React.FC<AssetGadgetFormProps> = ({
  onComplete,
}) => {
  const existingWheelAsset = useAtomValue(
    wheelAssetToEdit,
  ) as WheelAssetGadget | null;
  const isEdit = useMemo(
    () => Boolean(existingWheelAsset),
    [existingWheelAsset],
  );
  const form = useForm<z.infer<typeof createAssetGadgetFormSchema>>({
    resolver: zodResolver(createAssetGadgetFormSchema),
    mode: 'onChange',
    defaultValues: existingWheelAsset
      ? async () => {
          const { wheelImageFile, modalImageFile } =
            await existingWheelAssetImagesFiles(existingWheelAsset);
          return {
            name: existingWheelAsset.name,
            total_amount: existingWheelAsset.total_amount,
            article_type: existingWheelAsset.asset_type.gadget.article_type[0],
            wheel_image_file: wheelImageFile,
            modal_image_file: modalImageFile,
          };
        }
      : undefined,
  });
  const { toast } = useToast();
  const updateWheelAssetMutation = useUpdateWheelAsset();
  const createWheelAssetMutation = useCreateWheelAsset();
  const upsertWheelAssetImagesMutation = useUpsertWheelAssetImages();

  const onSubmit = async (
    data: z.infer<typeof createAssetGadgetFormSchema>,
  ) => {
    const prom = isEdit
      ? updateWheelAssetMutation.mutateAsync({
          id: existingWheelAsset!.id,
          name: data.name,
          total_amount: data.total_amount,
          asset_type_config: {
            gadget: {
              article_type: candidOpt(data.article_type),
            },
          },
        })
      : createWheelAssetMutation.mutateAsync({
          name: data.name,
          total_amount: data.total_amount,
          asset_type_config: {
            gadget: {
              article_type: candidOpt(data.article_type),
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
          <h2 className="text-lg font-medium">Token Info</h2>
          <div className="grid gap-x-2 gap-y-1 md:grid-cols-[180px_1fr]">
            <FormField
              control={form.control}
              name="article_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Article</FormLabel>
                  <FormControl>
                    <Input placeholder="Article" {...field} />
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
