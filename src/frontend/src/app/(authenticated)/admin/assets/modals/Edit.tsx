'use client';

import { FileInput } from '@/components/file-input';
import { InputNumberControls } from '@/components/input-number-controls';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/auth-context';
import type {
  Err,
  UpdateWheelAssetImageConfig,
  UpdateWheelAssetTypeConfig,
  WheelAsset,
} from '@/declarations/backend/backend.did';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import {
  candidOpt,
  formatBytes,
  getDecimalSeparator,
  localFileToSrc,
  renderError,
} from '@/lib/utils';
import { isWheelAssetToken, wheelAssetUrl } from '@/lib/wheel-asset';
import { zodResolver } from '@hookform/resolvers/zod';
import { Settings2 } from 'lucide-react';
import Image from 'next/image';
import { useCallback, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { DeleteAssetModal } from './Delete';

type EditAssetModalProps = {
  asset: WheelAsset;
  onEditComplete: () => Promise<void>;
};

const editAssetPrizeFormSchema = z.object({
  total_amount: z.coerce.number().min(0).max(1_000),
  prize_usd_amount: z.number().min(0).max(500).optional(),
});

const EditAssetPrizeForm: React.FC<EditAssetModalProps> = ({
  asset,
  onEditComplete,
}) => {
  const { actor } = useAuth();
  const form = useForm<z.infer<typeof editAssetPrizeFormSchema>>({
    resolver: zodResolver(editAssetPrizeFormSchema),
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

  const onSubmit = async (data: z.infer<typeof editAssetPrizeFormSchema>) => {
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
      .catch((e: Err) =>
        toast({
          title: 'Error updating asset prize',
          description: renderError(e),
          variant: 'destructive',
        }),
      );
  };

  return (
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
        <DialogFooter className="sm:justify-between">
          <DeleteAssetModal asset={asset} onDeleteComplete={onEditComplete} />
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
  );
};

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const IMAGE_ACCEPT_MIME_TYPES = ['image/png', 'image/svg+xml'];

const EditAssetImagesForm: React.FC<EditAssetModalProps> = ({
  asset,
  onEditComplete,
}) => {
  const { actor } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [wheelImageSrc, setWheelImageSrc] = useState<File | string | null>(
    wheelAssetUrl(asset.wheel_image_path) || null,
  );
  const [modalImageSrc, setModalImageSrc] = useState<File | string | null>(
    wheelAssetUrl(asset.modal_image_path) || null,
  );
  const { toast } = useToast();

  const handleSaveChanges = useCallback(async () => {
    setIsSubmitting(true);
    const toUpdate: UpdateWheelAssetImageConfig[] = [];
    if (wheelImageSrc instanceof File) {
      toUpdate.push({
        wheel: {
          content_type: wheelImageSrc.type,
          content_bytes: new Uint8Array(await wheelImageSrc.arrayBuffer()),
        },
      });
    }
    if (modalImageSrc instanceof File) {
      toUpdate.push({
        modal: {
          content_type: modalImageSrc.type,
          content_bytes: new Uint8Array(await modalImageSrc.arrayBuffer()),
        },
      });
    }

    Promise.all(
      toUpdate.map(config =>
        actor
          .update_wheel_asset_image({
            id: asset.id,
            image_config: config,
          })
          .then(extractOk),
      ),
    )
      .then(onEditComplete)
      .catch((e: Err) =>
        toast({
          title: 'Error saving images',
          description: renderError(e),
          variant: 'destructive',
        }),
      )
      .finally(() => setIsSubmitting(false));
  }, [onEditComplete, toast, actor, asset, wheelImageSrc, modalImageSrc]);

  return (
    <>
      <div className="my-4 grid gap-4 md:grid-cols-2">
        <div className="flex flex-col items-center justify-start">
          <h2 className="text-md font-semibold">
            Wheel Image (max. {formatBytes(MAX_IMAGE_SIZE_BYTES)})
          </h2>
          <Image
            className="my-4 h-[100px] object-contain"
            src={localFileToSrc(
              wheelImageSrc,
              '/images/wheel-item-placeholder.png',
            )}
            alt={`${asset.name} wheel image`}
            width={100}
            height={100}
          />
          <FileInput
            buttonText="Update"
            onChange={setWheelImageSrc}
            acceptMimeTypes={IMAGE_ACCEPT_MIME_TYPES}
            maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
          />
        </div>
        <div className="flex flex-col items-center justify-start">
          <h2 className="text-md font-semibold">
            Modal Image (max. {formatBytes(MAX_IMAGE_SIZE_BYTES)})
          </h2>
          <Image
            className="my-4 h-[100px] object-contain"
            src={localFileToSrc(
              modalImageSrc,
              '/images/wheel-modal-placeholder.png',
            )}
            alt={`${asset.name} modal image`}
            width={178}
            height={100}
          />
          <FileInput
            buttonText="Update"
            onChange={setModalImageSrc}
            acceptMimeTypes={IMAGE_ACCEPT_MIME_TYPES}
            maxSizeBytes={MAX_IMAGE_SIZE_BYTES}
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
      <DialogFooter className="sm:justify-between">
        <DeleteAssetModal asset={asset} onDeleteComplete={onEditComplete} />
        <Button
          variant="secondary"
          loading={isSubmitting}
          onClick={handleSaveChanges}
          disabled={
            // if either of the images are a file, this means that the user has
            // uploaded a new image
            !(wheelImageSrc instanceof File || modalImageSrc instanceof File)
          }
        >
          Save changes
        </Button>
      </DialogFooter>
    </>
  );
};

export const EditAssetModal: React.FC<EditAssetModalProps> = ({
  asset,
  onEditComplete,
}) => {
  const [open, setOpen] = useState(false);

  const handleOnComplete = useCallback(async () => {
    await onEditComplete();
    setOpen(false);
  }, [onEditComplete]);

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
        <Tabs defaultValue="images" className="w-full">
          <TabsList>
            <TabsTrigger value="images">Images</TabsTrigger>
            <TabsTrigger value="prize">Prize</TabsTrigger>
          </TabsList>
          <TabsContent value="images">
            <EditAssetImagesForm
              asset={asset}
              onEditComplete={handleOnComplete}
            />
          </TabsContent>
          <TabsContent value="prize">
            <EditAssetPrizeForm
              asset={asset}
              onEditComplete={handleOnComplete}
            />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
