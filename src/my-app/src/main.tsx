import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import {
  QueryCache,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import reportWebVitals from './reportWebVitals.ts';
import { AuthProvider } from '@/contexts/auth-context';
import { toast } from '@/hooks/use-toast';
import { renderError } from '@/lib/utils';
import { Toaster } from '@/components/ui/toaster';
import { printVersionToConsole } from '@/lib/utils';
import App from './App.tsx';
import './styles.css';

printVersionToConsole();

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

// Render the app
const rootElement = document.getElementById('app');
if (rootElement && !rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <App />
          <Toaster />
        </AuthProvider>
        <ReactQueryDevtools />
      </QueryClientProvider>
    </StrictMode>,
  );
}

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
