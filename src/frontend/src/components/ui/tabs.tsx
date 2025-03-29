'use client';

import * as React from 'react';
import * as TabsPrimitive from '@radix-ui/react-tabs';

import { cn } from '@/lib/utils';

const Tabs = TabsPrimitive.Root;

const TabsList = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) => (
  <TabsPrimitive.List
    data-slot="tabs-list"
    className={cn(
      'bg-dark-infinite text-indaco-blue inline-flex h-9 items-center justify-center rounded-lg p-1',
      className,
    )}
    {...props}
  />
);
TabsList.displayName = TabsPrimitive.List.displayName;

const TabsTrigger = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) => (
  <TabsPrimitive.Trigger
    data-slot="tabs-trigger"
    className={cn(
      'ring-offset-background focus-visible:ring-ring data-[state=active]:bg-infinite data-[state=active]:text-foreground focus-visible:outline-hidden inline-flex items-center justify-center whitespace-nowrap rounded-md px-3 py-1 text-sm font-medium transition-all focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:shadow-sm',
      className,
    )}
    {...props}
  />
);
TabsTrigger.displayName = TabsPrimitive.Trigger.displayName;

const TabsContent = ({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) => (
  <TabsPrimitive.Content
    data-slot="tabs-content"
    className={cn(
      'ring-offset-background focus-visible:ring-ring focus-visible:outline-hidden mt-2 focus-visible:ring-2 focus-visible:ring-offset-2',
      className,
    )}
    {...props}
  />
);
TabsContent.displayName = TabsPrimitive.Content.displayName;

export { Tabs, TabsList, TabsTrigger, TabsContent };
