import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';
import { cn } from '@/lib/utils';

type UserIdDisplayProps = {
  userId: string | undefined;
  className?: string;
};

export const UserIdDisplay: React.FC<UserIdDisplayProps> = ({
  userId,
  className,
}) => {
  if (!userId) {
    return null;
  }

  return (
    <div
      className={cn(
        'text-indaco-blue flex max-w-full flex-row items-center gap-1 overflow-hidden',
        className,
      )}
    >
      <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none">
        {userId}
      </p>
      <CopyToClipboardButton className="text-current" value={userId} />
    </div>
  );
};
