import { cn } from '@/lib/utils';
import { LoaderPinwheel } from 'lucide-react';

type LoaderProps = {
  className?: string;
};

export const Loader: React.FC<LoaderProps> = ({ className }) => {
  return <LoaderPinwheel className={cn('animate-spin', className)} />;
};
