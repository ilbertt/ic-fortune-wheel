import { EditUserDialog } from '@/components/edit-user-dialog';
import { PageContent, PageHeader, PageLayout } from '@/components/layouts';
import { Button } from '@/components/ui/button';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { User } from 'lucide-react';
import { Route as AdminRoute } from '@/routes/(authenticated)/admin';

export const Route = createFileRoute('/(authenticated)/admin/unassigned')({
  beforeLoad: ({ context }) => {
    if (context.user && !context.user.isUnassigned) {
      throw redirect({ to: AdminRoute.to, replace: true });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <PageLayout>
      <PageHeader title="Dashboard" />
      <PageContent>
        <div className="col-span-full flex flex-col items-center justify-center gap-2 text-center">
          <h2 className="text-2xl">
            You must wait for an admin to assign you a role.
          </h2>
          <EditUserDialog
            triggerButton={
              <Button variant="default">
                <User />
                Edit your profile
              </Button>
            }
          />
        </div>
      </PageContent>
    </PageLayout>
  );
}
