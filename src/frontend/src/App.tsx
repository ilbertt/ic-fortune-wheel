import { useAuth } from '@/contexts/auth-context';
import { createRouter, RouterProvider } from '@tanstack/react-router';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    auth: undefined!,
  },
  defaultPreload: 'intent',
  scrollRestoration: true,
  defaultStructuralSharing: true,
  defaultPreloadStaleTime: 0,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  const authContext = useAuth();
  return <RouterProvider router={router} context={{ auth: authContext }} />;
}
