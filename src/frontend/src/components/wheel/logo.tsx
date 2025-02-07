'use client';

import Logo from '@/assets/wheel/fortune-wheel-logo.png';
import { cn } from '@/lib/utils';
import Image from 'next/image';

type FortuneWheelLogoProps = React.HTMLAttributes<HTMLDivElement>;

export const FortuneWheelLogo: React.FC<FortuneWheelLogoProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'absolute left-1/2 top-1/2 z-10 flex aspect-square w-1/4 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border-[3px] border-white bg-white/60 p-2 backdrop-blur-sm',
        className,
      )}
      {...props}
    >
      <Image className="w-full" src={Logo} alt="fortune wheel logo" />
    </div>
  );
};
