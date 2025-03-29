import * as React from 'react';
import { Slot, Slottable } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Loader } from '@/components/loader';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-sm hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90',
        outline:
          'border border-zinc-400 bg-background text-white shadow-xs hover:bg-accent hover:text-primary hover:border-accent',
        secondary:
          'bg-secondary text-secondary-foreground shadow-xs hover:bg-dark-infinite opacity-80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        'border-gradient':
          'relative bg-zinc-900 text-white hover:bg-background before:absolute before:inset-[-1px] before:rounded-md before:from-[#c572ef]/0 before:via-indaco-blue before:to-[#c572ef]/0 before:bg-[conic-gradient(from_var(--angle),_var(--tw-gradient-stops))] before:animate-[rotate_5s_linear_infinite] before:-z-1 after:absolute after:inset-[1px] after:rounded-md after:bg-zinc-900 after:-z-1',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 px-3 text-xs',
        lg: 'h-10 px-8',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : 'button';

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        type={type}
        {...props}
      >
        {loading && <Loader />}
        <Slottable>
          {loading ? (size !== 'icon' ? 'Loading' : null) : children}
        </Slottable>
      </Comp>
    );
  },
);
Button.displayName = 'Button';

// eslint-disable-next-line react-refresh/only-export-components
export { Button, buttonVariants };
