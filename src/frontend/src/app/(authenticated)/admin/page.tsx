'use client';

import { Button } from '@/components/ui/button';
import { PageLayout, PageContent, PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, User, Users } from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import { EditUserDialog } from '@/components/edit-user-dialog';

export default function Home() {
  const { isCurrentUserUnassigned } = useUser();

  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        rightContent={<Button variant="secondary">Action</Button>}
      />
      <PageContent>
        {!isCurrentUserUnassigned && (
          <>
            <Card className="col-span-full md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Participants
                </CardTitle>
                <Users className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">2350</CardContent>
            </Card>
            <Card className="col-span-full md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Available Balance
                </CardTitle>
                <DollarSign className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">$800.00</CardContent>
            </Card>
            <Card className="col-span-full md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Spent</CardTitle>
                <CreditCard className="text-indaco-blue size-4" />
              </CardHeader>
              <CardContent className="text-2xl font-bold">$200.00</CardContent>
            </Card>
            <div className="hidden md:col-span-3 md:block" />
          </>
        )}
        {isCurrentUserUnassigned && (
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
        )}
      </PageContent>
    </PageLayout>
  );
}
