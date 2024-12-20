import { Principal } from '@dfinity/principal';
import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';

type PrincipalDisplayProps = {
  principal: Principal;
};

export const PrincipalDisplay: React.FC<PrincipalDisplayProps> = ({
  principal,
}) => {
  return (
    <div className="flex flex-row flex-wrap items-center gap-1">
      <p className="text-muted-foreground text-xs leading-none">
        {principal.toText().replace(/^(.{10})(.*)(.{10})$/, '$1…$3')}
      </p>
      <CopyToClipboardButton value={principal.toText()} />
    </div>
  );
};
