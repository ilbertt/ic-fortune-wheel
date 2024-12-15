import { LoaderPinwheel } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <div
      className={cn(
        'flex h-6 w-fit items-center justify-start gap-2 text-lg font-medium [&>svg]:size-6',
        className,
      )}
    >
      <LoaderPinwheel />
      Fortune Wheel
    </div>
  );
};
