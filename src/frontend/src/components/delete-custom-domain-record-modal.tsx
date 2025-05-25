import type { CustomDomainRecord } from '@/declarations/backend/backend.did';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useDeleteCustomDomainRecord } from '@/hooks/use-delete-custom-domain-record';
import { bnRegistrationIdFromBnRegistrationState } from '@/lib/custom-domain-record';

type DeleteCustomDomainRecordModalProps = {
  record: CustomDomainRecord;
};

export const DeleteCustomDomainRecordModal: React.FC<
  DeleteCustomDomainRecordModalProps
> = ({ record }) => {
  const [open, setOpen] = useState(false);
  const { mutateAsync: deleteCustomDomainRecord, isPending: isDeleting } =
    useDeleteCustomDomainRecord();

  const onDelete = async () => {
    await deleteCustomDomainRecord({
      recordId: record.id,
      bnRegistrationId: bnRegistrationIdFromBnRegistrationState(
        record.bn_registration_state,
      ),
    });
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button size="sm" variant="destructive" loading={isDeleting}>
          <Trash2 />
          Delete
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Delete "{record.domain_name}" custom domain?
          </AlertDialogTitle>
          <AlertDialogDescription className="[&_.lucide-triangle-alert]:mr-1 [&_.lucide-triangle-alert]:inline-block [&_.lucide-triangle-alert]:size-4 [&_.lucide-triangle-alert]:align-text-bottom [&_.lucide-triangle-alert]:text-yellow-500">
            Are you sure you want to delete {record.domain_name}? This action
            cannot be undone.
            <br />
            <br />
            <AlertTriangle />
            Warning: You won't be able to access the app using the same account
            on this domain.
            <br />
            <br />
            <AlertTriangle />
            Warning: This action will NOT remove the domain from the DNS
            records. You will need to remove the domain from the DNS records
            manually.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            asChild
            className={buttonVariants({ variant: 'destructive' })}
          >
            <Button loading={isDeleting} onClick={onDelete}>
              Delete
            </Button>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};
