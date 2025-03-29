import { Button } from '@/components/ui/button';
import { formatBytes } from '@/lib/utils';
import { useCallback, useRef, useState } from 'react';

type FileInputProps = {
  buttonText: React.ReactNode;
  onChange: (file: File | null) => void;
  acceptMimeTypes?: string[];
  maxSizeBytes?: number;
};

export const FileInput: React.FC<FileInputProps> = ({
  buttonText,
  onChange,
  acceptMimeTypes,
  maxSizeBytes,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [internalFile, setInternalFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleOnChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0] || null;

      if (file && maxSizeBytes && file.size > maxSizeBytes) {
        e.target.value = '';
        setError(`File size exceeds ${formatBytes(maxSizeBytes)}`);
        return;
      }

      setError(null);
      setInternalFile(file);
      onChange(file);
    },
    [onChange, maxSizeBytes],
  );

  const handleButtonClick = useCallback(() => {
    inputRef.current?.click();
  }, []);

  return (
    <div className="flex flex-col items-center space-y-2">
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept={acceptMimeTypes?.join(',')}
        onChange={handleOnChange}
      />
      <Button onClick={handleButtonClick}>{buttonText}</Button>
      {error && (
        <p className="text-destructive text-[0.8rem] font-medium">{error}</p>
      )}
      {internalFile && (
        <p className="text-muted-foreground text-xs">
          {internalFile.name} ({formatBytes(internalFile.size)})
        </p>
      )}
    </div>
  );
};
