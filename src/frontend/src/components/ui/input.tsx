import * as React from 'react';

import { cn, parseFormattedNumber, renderNumberWithDigits } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base shadow-sm transition-colors [appearance:textfield] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        ref={ref}
        {...props}
      />
    );
  },
);
Input.displayName = 'Input';

const InputWithPrefix = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<'input'> & {
    /**
     * Should be a symbol like _€_, _$_ or _%_.
     *
     * Symbols longer than 3 characters may not layout correctly.
     */
    prefix: string;
  }
>(({ prefix, className, ...props }, ref) => {
  return (
    <div className="relative">
      <span
        className={cn('absolute left-3 top-1.5', {
          'text-muted': props.disabled,
        })}
        aria-hidden
      >
        {prefix}
      </span>
      <Input
        ref={ref}
        className={cn(
          {
            'pl-10': prefix.length === 1,
            'pl-12': prefix.length === 2,
            'pl-[60px]': prefix.length > 2,
          },
          className,
        )}
        {...props}
      />
    </div>
  );
});
InputWithPrefix.displayName = 'InputWithPrefix';

const CurrencyInput = React.forwardRef<
  HTMLInputElement,
  Omit<React.ComponentProps<'input'>, 'type' | 'onChange' | 'value'> & {
    /**
     * @default '$'
     */
    currency: string;
    onChange?: (value: number | null) => void;
    value?: number | null;
  }
>(({ currency = '$', value, onChange, onBlur, ...props }, ref) => {
  const [displayValue, setDisplayValue] = React.useState(
    renderNumberWithDigits(value, 2),
  );

  const handleOnChange = React.useCallback(
    (val: string | null) => {
      setDisplayValue(val ?? undefined);
      if (onChange) {
        if (val) {
          const numericValue = parseFormattedNumber(val);
          onChange(numericValue ?? null);
        } else {
          onChange(null);
        }
      }
    },
    [onChange],
  );

  const handleOnBlur = React.useCallback(
    (e: React.FocusEvent<HTMLInputElement>) => {
      setDisplayValue(renderNumberWithDigits(displayValue, 2));
      if (onBlur) {
        onBlur(e);
      }
    },
    [displayValue, onBlur],
  );

  return (
    <InputWithPrefix
      prefix={currency}
      ref={ref}
      {...props}
      value={displayValue}
      onChange={e => handleOnChange(e.target.value)}
      onBlur={handleOnBlur}
      type="text"
      inputMode="decimal"
      step="0.01"
    />
  );
});
CurrencyInput.displayName = 'CurrencyInput';

export { Input, InputWithPrefix, CurrencyInput };
