import { useFormField } from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { useFormContext } from 'react-hook-form';
import { useCallback } from 'react';
import { Minus, Plus } from 'lucide-react';

export const InputNumberControls = () => {
  const { name } = useFormField();
  const form = useFormContext();

  const handleButtonClick = useCallback(
    (op: 'add' | 'subtract') => {
      const currentVal = Number(form.getValues()[name]);
      const newVal = currentVal + (op === 'add' ? 1 : -1);

      form.setValue(name, newVal, {
        shouldDirty: true,
        shouldTouch: true,
        shouldValidate: true,
      });
    },
    [form, name],
  );

  return (
    <div className="flex flex-row items-center justify-start gap-1.5">
      <Button size="icon" onClick={() => handleButtonClick('subtract')}>
        <Minus />
      </Button>
      <Button size="icon" onClick={() => handleButtonClick('add')}>
        <Plus />
      </Button>
    </div>
  );
};
