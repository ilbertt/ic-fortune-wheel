import type { CustomDomainRecord } from '@/declarations/backend/backend.did';
import { CopyToClipboardButton } from '@/components/copy-to-clipboard-button';
import { Badge } from '@/components/ui/badge';
import { enumKey } from '@/lib/utils';
import { Loader } from '@/components/loader';
import { CheckCircle2, Hourglass, XCircle } from 'lucide-react';
import { capitalCase } from 'change-case';
import { DeleteCustomDomainRecordModal } from '@/components/delete-custom-domain-record-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { canisterId } from '@/lib/api';
import { Separator } from '@/components/ui/separator';
import { CopyToClipboardPre } from '@/components/copy-to-clipboard-pre';
import { Checkbox } from './ui/checkbox';
import { useState } from 'react';
import { bnRegistrationErrorMessageFromBnRegistrationState } from '@/lib/custom-domain-record';
import { usePollAndUpdateCustomDomainRecord } from '@/hooks/use-poll-and-update-custom-domain-record';
import { useCreateBnRegistration } from '@/hooks/use-create-bn-registration';
import { useUpdateCustomDomainRecord } from '@/hooks/use-update-custom-domain-record';

const customDomainWebPage = (domainName: string): string =>
  `https://${domainName}`;

export const CustomDomainRecordRow: React.FC<{
  record: CustomDomainRecord;
}> = ({ record }) => {
  const [isDnsConfigured, setIsDnsConfigured] = useState(false);
  const state = enumKey(record.bn_registration_state);
  const {
    mutateAsync: createBnRegistration,
    isPending: isCreatingBnRegistration,
  } = useCreateBnRegistration();
  const {
    mutateAsync: updateCustomDomainRecord,
    isPending: isUpdatingCustomDomainRecord,
  } = useUpdateCustomDomainRecord();
  usePollAndUpdateCustomDomainRecord({
    record,
    enabled: state === 'pending',
  });

  const onFinishRegistration = async () => {
    const { id: bnRegistrationId } = await createBnRegistration({
      name: record.domain_name,
    });
    await updateCustomDomainRecord({
      id: record.id,
      bn_registration_state: {
        pending: { bn_registration_id: bnRegistrationId },
      },
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-[1fr_auto_auto]">
        <div className="flex flex-row gap-2 font-mono">
          {state === 'registered' ? (
            <a
              href={customDomainWebPage(record.domain_name)}
              className="clickable-link"
            >
              {customDomainWebPage(record.domain_name)}
            </a>
          ) : (
            <>
              {record.domain_name}{' '}
              <CopyToClipboardButton value={record.domain_name} />
            </>
          )}
        </div>
        <Badge
          className="h-6"
          variant={
            state === 'registered'
              ? 'success'
              : state === 'pending' || state === 'not_started'
                ? 'warning'
                : state === 'failed'
                  ? 'destructive'
                  : undefined
          }
        >
          {state === 'not_started' && <Hourglass />}
          {state === 'pending' && <Loader />}
          {state === 'failed' && <XCircle />}
          {state === 'registered' && <CheckCircle2 />}
          {capitalCase(state)}
        </Badge>
        <DeleteCustomDomainRecordModal record={record} />
      </div>
      {state === 'not_started' && (
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">
            Now, you have to configure your DNS with the following records:
          </p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Type</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>
                  <CopyToClipboardPre value="CNAME" />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre value={record.domain_name} />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre value={`${record.domain_name}.icp1.io`} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <CopyToClipboardPre value="TXT" />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre
                    value={`_canister_id.${record.domain_name}`}
                  />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre value={canisterId} />
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <CopyToClipboardPre value="CNAME" />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre
                    value={`_acme-challenge.${record.domain_name}`}
                  />
                </TableCell>
                <TableCell>
                  <CopyToClipboardPre value={`${record.domain_name}.icp2.io`} />
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
          <Separator className="my-4" />
          <div className="flex flex-row items-center gap-2">
            <Checkbox
              checked={isDnsConfigured}
              onCheckedChange={val =>
                setIsDnsConfigured(val === 'indeterminate' ? false : val)
              }
            />
            <p>I have configured my DNS according to the table above</p>
          </div>
          <Button
            className="mt-2"
            disabled={!isDnsConfigured}
            loading={isCreatingBnRegistration || isUpdatingCustomDomainRecord}
            onClick={onFinishRegistration}
          >
            Finish registration
          </Button>
        </div>
      )}
      {state === 'failed' && (
        <div className="mt-4">
          <p className="text-muted-foreground text-sm">
            The domain registration failed. To try again, please delete the
            record and create a new one.
          </p>
          <div className="text-destructive mt-2 font-medium">
            {bnRegistrationErrorMessageFromBnRegistrationState(
              record.bn_registration_state,
            ) ?? 'Unknown error'}
          </div>
        </div>
      )}
    </div>
  );
};
