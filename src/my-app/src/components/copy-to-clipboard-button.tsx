'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Check, Copy } from 'lucide-react';
import { forwardRef, useCallback, useState } from 'react';

type CopyToClipboardButtonProps = Omit<
  React.ComponentProps<typeof Button>,
  'size' | 'onClick'
> & {
  value: string;
};

export const CopyToClipboardButton = forwardRef<
  HTMLButtonElement,
  CopyToClipboardButtonProps
>(({ className, value, ...props }, ref) => {
  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(value);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [value]);

  return (
    <Button
      ref={ref}
      size="icon"
      variant="ghost"
      className={cn('text-muted-foreground size-5', className)}
      {...props}
      onClick={handleCopy}
    >
      {isCopied ? <Check className="text-green-500" /> : <Copy />}
    </Button>
  );
});
CopyToClipboardButton.displayName = 'CopyToClipboardButton';
