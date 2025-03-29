import { cn } from '@/lib/utils';

type BorderVerticalGradientContainerProps = {
  children: React.ReactNode;
  className: string;
};

export const BorderVerticalGradientContainer: React.FC<
  BorderVerticalGradientContainerProps
> = ({ children, className }) => {
  return (
    <div
      // CSS adapted from https://stackoverflow.com/a/26661292
      className={cn(
        'bg-no-repeat',
        'overflow-hidden px-[var(--border-width)] [&>div]:h-full [&>div]:w-full',
        className,
      )}
      style={{
        borderTopColor: 'var(--tw-gradient-from)',
        borderTopWidth: 'var(--border-width)',
        borderBottomColor: 'var(--tw-gradient-to)',
        borderBottomWidth: 'var(--border-width)',
        backgroundSize: 'var(--border-width) 100%',
        backgroundPosition: 'left bottom, right bottom',
        backgroundImage:
          'linear-gradient(to bottom, var(--tw-gradient-stops)),linear-gradient(to bottom, var(--tw-gradient-stops))',
      }}
    >
      {children}
    </div>
  );
};
