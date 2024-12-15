import { cn } from '@/lib/utils';
import Image from 'next/image';

type BaseProps = React.HTMLAttributes<HTMLImageElement>;

export const GithubIcon: React.FC<BaseProps> = ({ className, ...props }) => (
  <Image
    width={24}
    height={24}
    src="/icons/github.svg"
    alt="GitHub"
    {...props}
    className={cn('invert', className)}
  />
);
