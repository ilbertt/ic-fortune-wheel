import { NewCustomDomainForm } from '@/components/new-custom-domain-form';
import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useCustomDomainRecords } from '@/hooks/use-custom-domain-records';
import { createFileRoute } from '@tanstack/react-router';
import { Loader } from 'lucide-react';
import { CustomDomainRecordRow } from '@/components/custom-domain-record-row';

export const Route = createFileRoute('/(authenticated)/admin/settings')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data, isLoading } = useCustomDomainRecords();

  return (
    <PageLayout>
      <PageHeader title="Settings" />
      <PageContent>
        <Card className="col-span-full">
          <CardHeader>
            <CardTitle>Custom Domain</CardTitle>
            <CardDescription>
              Assign a custom domain to your wheel. For more information about
              custom domains and how to configure your DNS, refer to the{' '}
              <a
                href="https://internetcomputer.org/docs/building-apps/frontends/custom-domains/using-custom-domains"
                target="_blank"
                rel="noopener noreferrer"
                className="clickable-link"
              >
                documentation
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-6 lg:grid-cols-3 2xl:grid-cols-4">
            {isLoading ? (
              <Loader />
            ) : !data || data.length === 0 ? (
              <NewCustomDomainForm />
            ) : (
              <div className="col-span-full lg:col-span-2">
                {data?.map(record => (
                  <CustomDomainRecordRow key={record.id} record={record} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </PageContent>
    </PageLayout>
  );
}
