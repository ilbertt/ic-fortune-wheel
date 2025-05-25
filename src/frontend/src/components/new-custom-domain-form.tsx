import type { CreateCustomDomainRecordRequest } from '@/declarations/backend/backend.did';
import { type ZodProperties } from '@/lib/types/utils';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useCreateCustomDomainRecord } from '@/hooks/use-create-custom-domain-record';

type FormSchemaType = CreateCustomDomainRecordRequest;

const formSchema = z.object<ZodProperties<FormSchemaType>>({
  domain_name: z
    .string()
    // Same checks as in the backend
    .max(255)
    .regex(/^([A-Za-z0-9][A-Za-z0-9-]{0,61}[A-Za-z0-9]\.)+[A-Za-z]{2,63}$/, {
      message: 'Invalid domain name',
    }),
});

export const NewCustomDomainForm: React.FC = () => {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    mode: 'onChange',
  });
  const { isValid: isFormValid } = form.formState;
  const { mutateAsync: createCustomDomainRecord, isPending: isCreating } =
    useCreateCustomDomainRecord();

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    await createCustomDomainRecord(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="domain_name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Domain name*</FormLabel>
              <FormControl>
                <Input placeholder="foo.bar.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          variant="secondary"
          loading={isCreating}
          disabled={!isFormValid}
        >
          Start registration
        </Button>
      </form>
    </Form>
  );
};
