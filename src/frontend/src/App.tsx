import './styles.css';
import { useAuth } from '@/hooks/use-auth';
import { RouterProvider } from '@tanstack/react-router';
import { AuthProvider } from '@/providers/auth-provider';
import { router } from './router';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { toast } from '@/hooks/use-toast';
import { renderError } from '@/lib/utils';
import { useUser } from './hooks/use-user';
import { LoadingPage } from './components/loading-page';

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

function InnerApp() {
  const auth = useAuth();
  const { user } = useUser();
  if (auth.isAuthenticated && !user) {
    return <LoadingPage />;
  }
  return <RouterProvider router={router} context={{ auth, user }} />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <InnerApp />
        <Toaster />
      </AuthProvider>
      <ReactQueryDevtools />
    </QueryClientProvider>
  );
}
