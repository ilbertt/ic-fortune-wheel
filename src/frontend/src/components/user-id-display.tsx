import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';

type UserIdDisplayProps = {
  userId: string | undefined;
};

export const UserIdDisplay: React.FC<UserIdDisplayProps> = ({ userId }) => {
  if (!userId) {
    return null;
  }

  return (
    <div className="text-indaco-blue flex max-w-full flex-row items-center gap-1 overflow-hidden">
      <p className="flex-1 overflow-hidden text-ellipsis whitespace-nowrap text-xs leading-none">
        {userId}
      </p>
      <CopyToClipboardButton className="text-current" value={userId} />
    </div>
  );
};
