'use client';

import { renderError } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { useState } from 'react';
import { useUser } from '@/contexts/user-context';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { extractOk } from '@/lib/api';
import { type Err } from '@/declarations/backend/backend.did';
import { UserIdDisplay } from '@/components/user-id-display';
import { Label } from '@/components/ui/label';
import { UserRoleBadge } from './user-role-badge';
import { ROUTES } from '@/lib/routes';
import Link from 'next/link';

const editUserFormSchema = z.object({
  username: z.string().min(1),
});

type EditUserDialogProps = {
  triggerButton: React.ReactNode;
};

export const EditUserDialog: React.FC<EditUserDialogProps> = ({
  triggerButton,
}) => {
  const { actor } = useAuth();
  const { user, fetchUser } = useUser();
  const form = useForm<z.infer<typeof editUserFormSchema>>({
    resolver: zodResolver(editUserFormSchema),
    mode: 'onChange',
    defaultValues: {
      username: user?.username || '',
    },
  });
  const { isValid: isFormValid, isSubmitting: isFormSubmitting } =
    form.formState;
  const { toast } = useToast();
  const [open, setOpen] = useState(false);

  const onSubmit = async (data: z.infer<typeof editUserFormSchema>) => {
    await actor
      .update_my_user_profile({
        username: [data.username],
      })
      .then(extractOk)
      .then(async () => {
        await fetchUser();
        setOpen(false);
      })
      .catch((e: Err) => {
        const title = 'Error updating user';
        console.error(title, e);
        toast({
          title,
          description: renderError(e),
          variant: 'destructive',
        });
      });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{triggerButton}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]" disableClickOutside>
        <DialogHeader>
          <DialogTitle>Edit profile</DialogTitle>
          <DialogDescription>
            Make changes to your profile here. Click save when you&apos;re done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label>Your ID</Label>
                <UserIdDisplay userId={user?.id} />
              </div>
              <div className="grid w-full max-w-sm items-center gap-1.5">
                <Label>Your Role</Label>
                {user && <UserRoleBadge userRole={user.role} />}
                <p className="text-muted-foreground text-[0.8rem]">
                  The role can be changed by admins in the{' '}
                  <Link
                    href={ROUTES.dashboard.team}
                    className="text-indaco-blue underline"
                  >
                    Team
                  </Link>{' '}
                  page.
                </p>
              </div>
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Your Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Your name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                loading={isFormSubmitting}
                disabled={!isFormValid}
              >
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
