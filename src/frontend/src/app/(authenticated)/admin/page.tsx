'use client';

import { useState } from 'react';
import { backend } from '@/declarations/backend';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageLayout, PageContent, PageHeader } from '@/components/layouts';
import { printVersionToConsole } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, DollarSign, Users } from 'lucide-react';

printVersionToConsole();

export default function Home() {
  const [greeting, setGreeting] = useState('');

  const handleSubmit: React.FormEventHandler<HTMLFormElement> = event => {
    event.preventDefault();
    // @ts-expect-error types are wrong for DOM elements
    const name = (event.target as HTMLFormElement).elements.name.value;
    backend.greet(name).then(greeting => {
      setGreeting(greeting);
    });
    return false;
  };

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
        <div className="col-span-4">
          <form action="#" onSubmit={handleSubmit}>
            <label htmlFor="name">Enter your name: &nbsp;</label>
            <Input id="name" alt="Name" type="text" />
            <Button type="submit">Click Me!</Button>
          </form>
          <section id="greeting">{greeting}</section>
        </div>
      </PageContent>
    </PageLayout>
  );
}
