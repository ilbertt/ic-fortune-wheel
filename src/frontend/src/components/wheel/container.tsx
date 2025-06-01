import { cn } from '@/lib/utils';

type WheelContainerProps = React.HTMLAttributes<HTMLDivElement>;

export const FortuneWheelContainer: React.FC<WheelContainerProps> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
};
