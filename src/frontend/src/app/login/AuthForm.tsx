'use client';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Infinity, LoaderPinwheel } from 'lucide-react';

type AuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function AuthForm({ className, ...props }: AuthFormProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);

  async function onSubmit(event: React.SyntheticEvent) {
    event.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
    }, 3000);
  }

  return (
    <div
      className={cn('grid w-full gap-6 px-10 sm:w-[350px] md:p-0', className)}
      {...props}
    >
      <form onSubmit={onSubmit}>
        <div className="grid gap-2">
          <Button loading={isLoading}>
            <Infinity /> Sign In with Internet Identity
          </Button>
        </div>
      </form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background text-muted-foreground px-2">
            Or go to the
          </span>
        </div>
      </div>
      <Button variant="secondary" type="button" loading={isLoading}>
        <LoaderPinwheel />
        Fortune Wheel
      </Button>
    </div>
  );
}
