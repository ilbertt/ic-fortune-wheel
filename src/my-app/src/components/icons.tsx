import { cn } from '@/lib/utils';

type BaseProps = React.HTMLAttributes<HTMLImageElement>;

export const GithubIcon: React.FC<BaseProps> = ({ className, ...props }) => (
  <img
    width={24}
    height={24}
    src="/icons/github.svg"
    alt="GitHub"
    {...props}
    className={cn('invert', className)}
  />
);
