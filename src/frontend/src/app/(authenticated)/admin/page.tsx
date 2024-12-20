'use client';

import { Button } from '@/components/ui/button';
import { PageLayout, PageContent, PageHeader } from '@/components/layouts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Users } from 'lucide-react';

export default function Home() {
  return (
    <PageLayout>
      <PageHeader
        title="Dashboard"
        rightContent={<Button variant="secondary">Action</Button>}
      />
      <PageContent>
        <Card className="col-span-full md:col-span-3">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Participants</CardTitle>
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
      </PageContent>
    </PageLayout>
  );
}
