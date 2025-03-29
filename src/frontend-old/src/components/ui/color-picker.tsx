'use client';

import { forwardRef, useCallback, useEffect, useState } from 'react';
import { HexColorPicker } from 'react-colorful';
import { cn } from '@/lib/utils';
import { useForwardedRef } from '@/hooks/use-forwarded-ref';
import type { ButtonProps } from '@/components/ui/button';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';

interface ColorPickerProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
}

/**
 * Inspired by https://github.com/nightspite/shadcn-color-picker.
 */
const ColorPicker = forwardRef<
  HTMLInputElement,
  Omit<ButtonProps, 'value' | 'onChange' | 'onBlur'> & ColorPickerProps
>(
  (
    { disabled, value: valueProp, onChange, onBlur, name, className, ...props },
    forwardedRef,
  ) => {
    const ref = useForwardedRef(forwardedRef);
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(valueProp || '#FFFFFF');

    const handleOnOpenChange = useCallback(
      (open: boolean) => {
        if (!open) {
          onChange(value);
        }
        setOpen(open);
      },
      [onChange, value],
    );

    useEffect(() => {
      setValue(valueProp || '#FFFFFF');
    }, [valueProp]);

    return (
      <Popover onOpenChange={handleOnOpenChange} open={open}>
        <PopoverTrigger asChild disabled={disabled} onBlur={onBlur}>
          <Button
            {...props}
            className={cn('block', className)}
            name={name}
            onClick={() => setOpen(true)}
            size="icon"
            style={{
              backgroundColor: value,
            }}
            variant="outline"
          >
            <div />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="flex w-full flex-col gap-1">
          <HexColorPicker color={value} onChange={setValue} />
          <Input
            maxLength={7}
            onChange={e => {
              setValue(e?.currentTarget?.value || '');
            }}
            ref={ref}
            value={value}
          />
        </PopoverContent>
      </Popover>
    );
  },
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
