'use client';

import { toast } from '@/hooks/use-toast';
import { renderError } from '@/lib/utils';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => {
      const title = query.meta?.errorMessage || 'Error';
      console.error(title, error);
      toast({
        title,
        description: renderError(error),
        variant: 'destructive',
      });
    },
  }),
});

type ClientLayoutProps = {
  children: React.ReactNode;
};

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
};
