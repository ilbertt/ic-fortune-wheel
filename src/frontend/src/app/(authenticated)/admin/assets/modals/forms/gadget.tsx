'use client';

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
import { useAuth } from '@/contexts/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { candidOpt, renderError } from '@/lib/utils';
import { extractOk } from '@/lib/api';
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
  PrizeFormFields,
  upsertImages,
} from './shared';

type CreateAssetGadgetFormSchemaType = Omit<
  CreateWheelAssetRequest,
  'asset_type_config' | 'wheel_ui_settings'
> & {
  article_type: string | undefined;
  modal_image_file: File | undefined;
  wheel_image_file: File | undefined;
};

const createAssetGadgetFormSchema = z.object<
  ZodProperties<CreateAssetGadgetFormSchemaType>
>({
  name: z.string().min(1).max(100),
  total_amount: z.coerce.number().min(0).max(1_000),
  article_type: z.string().optional(),
  modal_image_file: z.instanceof(File).optional(),
  wheel_image_file: z.instanceof(File).optional(),
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
  const { actor } = useAuth();
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

  const onSubmit = async (
    data: z.infer<typeof createAssetGadgetFormSchema>,
  ) => {
    const prom = isEdit
      ? actor
          .update_wheel_asset({
            id: existingWheelAsset!.id,
            state: [],
            used_amount: [],
            name: candidOpt(data.name),
            total_amount: candidOpt(data.total_amount),
            asset_type_config: candidOpt({
              gadget: {
                article_type: candidOpt(data.article_type),
              },
            }),
            wheel_ui_settings: [],
          })
          .then(extractOk)
      : actor
          .create_wheel_asset({
            name: data.name,
            total_amount: data.total_amount,
            asset_type_config: {
              gadget: {
                article_type: candidOpt(data.article_type),
              },
            },
            wheel_ui_settings: [],
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
