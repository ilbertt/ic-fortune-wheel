import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';
import { cn } from '@/lib/utils';
import { HTMLAttributes } from 'react';

type CopyToClipboardPreProps = HTMLAttributes<HTMLDivElement> & {
  value: string;
};

export const CopyToClipboardPre: React.FC<CopyToClipboardPreProps> = ({
  value,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-row items-center justify-start gap-2',
        className,
      )}
      {...props}
    >
      <pre className="grow">{value}</pre>
      <CopyToClipboardButton value={value} />
    </div>
  );
};
