import * as React from 'react';

import { cn, parseFormattedNumber, renderNumberWithDigits } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, value, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'border-input file:text-foreground placeholder:text-muted-foreground focus-visible:ring-ring shadow-xs focus-visible:outline-hidden flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-base transition-colors [appearance:textfield] file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none',
          className,
        )}
        ref={ref}
        value={value ?? ''} // workaround to avoid the controlled component error
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
     * Should be a symbol like _€_, _$_, _%_, _BTC_, _ckETH_, etc.
     *
     * Symbols longer than 5 characters may not layout correctly.
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
            'pl-[60px]': prefix.length > 2 && prefix.length <= 4,
            'pl-[90px]': prefix.length > 4,
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
  Omit<
    React.ComponentProps<'input'>,
    'type' | 'onChange' | 'value' | 'placeholder'
  > & {
    /**
     * @default '$'
     */
    currency: string;
    /**
     * @default '1.00'
     */
    placeholder?: string;
    onChange?: (value: number | null) => void;
    value?: number | null;
    /**
     * @default { minimumFractionDigits: 2, maximumFractionDigits: 2 }
     */
    formatOptions?: Intl.NumberFormatOptions;
  }
>(
  (
    {
      currency = '$',
      value,
      onChange,
      onBlur,
      formatOptions = { minimumFractionDigits: 2, maximumFractionDigits: 2 },
      placeholder = '1.00',
      ...props
    },
    ref,
  ) => {
    const [displayValue, setDisplayValue] = React.useState(
      renderNumberWithDigits(value, formatOptions),
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
        setDisplayValue(renderNumberWithDigits(displayValue, formatOptions));
        if (onBlur) {
          onBlur(e);
        }
      },
      [displayValue, onBlur, formatOptions],
    );

    React.useEffect(() => {
      setDisplayValue(prev => {
        // only set the value if it's not already set
        // e.g. when the component is controlled
        if (!prev) {
          return renderNumberWithDigits(value, formatOptions);
        }
        return prev;
      });
    }, [value, formatOptions]);

    return (
      <InputWithPrefix
        prefix={currency}
        ref={ref}
        {...props}
        placeholder={placeholder}
        value={displayValue}
        onChange={e => handleOnChange(e.target.value)}
        onBlur={handleOnBlur}
        type="text"
        inputMode="decimal"
        step="0.01"
      />
    );
  },
);
CurrencyInput.displayName = 'CurrencyInput';

export { Input, InputWithPrefix, CurrencyInput };
