'use client';

import { useAtom, useAtomValue } from 'jotai';
import { formAssetTypeAtom } from '../../atoms';
import { Button } from '@/components/ui/button';
import { ChevronLeft } from 'lucide-react';
import { cn, formatBytes, localFileToSrc } from '@/lib/utils';
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { FileInput } from '@/components/file-input';
import { useFormContext } from 'react-hook-form';
import { CurrencyInput, Input } from '@/components/ui/input';
import { DialogFooter } from '@/components/ui/dialog';
import { DeleteAssetModal } from '../delete';
import { capitalCase } from 'change-case';

const BackButton = () => {
  const [assetType, setAssetType] = useAtom(formAssetTypeAtom);

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

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB
const IMAGE_ACCEPT_MIME_TYPES = ['image/png', 'image/svg+xml'];

export type ImagesFormFieldsProps = {
  wheel_image_file: File | undefined;
  modal_image_file: File | undefined;
};

export const ImagesFormFields = () => {
  const form = useFormContext<ImagesFormFieldsProps>();

  return (
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
                <img
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
                <img
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
  );
};

type PrizeFormFieldsProps = {
  total_amount: number;
  prize_usd_amount?: number;
};

export const PrizeFormFields = () => {
  const assetType = useAtomValue(formAssetTypeAtom);
  const form = useFormContext<PrizeFormFieldsProps>();

  return (
    <div className="space-y-2">
      <h2 className="text-lg font-medium">Prize</h2>
      <div className="grid gap-x-2 gap-y-1 md:grid-cols-2">
        <FormField
          control={form.control}
          name="total_amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Prize Quantity *</FormLabel>
              <FormControl>
                <div className="flex flex-row flex-wrap items-center justify-start gap-1.5 md:flex-nowrap">
                  <Input
                    type="number"
                    className="w-32"
                    placeholder="100"
                    {...field}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="prize_usd_amount"
          disabled={assetType !== 'token'}
          render={({ field }) => (
            <FormItem className={cn({ hidden: assetType !== 'token' })}>
              <FormLabel>Prize Value *</FormLabel>
              <FormControl>
                <CurrencyInput currency="$" className="w-32" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
};

type FormFooterProps = {
  isEdit: boolean;
  onComplete: () => Promise<void>;
};

export const FormFooter: React.FC<FormFooterProps> = ({
  isEdit,
  onComplete,
}) => {
  const assetType = useAtomValue(formAssetTypeAtom)!;
  const form = useFormContext();
  const {
    isValid: isFormValid,
    isSubmitting: isFormSubmitting,
    isDirty: isFormDirty,
  } = form.formState;

  return (
    <DialogFooter className="sm:items-center sm:justify-between">
      {isEdit ? (
        <DeleteAssetModal onDeleteComplete={onComplete} />
      ) : (
        <BackButton />
      )}
      <Button
        type="submit"
        variant="secondary"
        loading={isFormSubmitting}
        disabled={!isFormValid || !isFormDirty}
      >
        {isEdit ? 'Save Changes' : `Add ${capitalCase(assetType)}`}
      </Button>
    </DialogFooter>
  );
};
