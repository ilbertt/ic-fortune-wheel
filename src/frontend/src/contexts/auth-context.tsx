'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthClient } from '@dfinity/use-auth-client';
import { idlFactory, canisterId } from '@/declarations/backend';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';

const identityProvider =
  process.env.DFX_NETWORK === 'local'
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
    : 'https://identity.ic0.app';

type AuthContextType = ReturnType<typeof useAuthClient>;

export const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType,
);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const auth = useAuthClient({
    loginOptions: {
      identityProvider,
    },
    actorOptions: {
      canisterId,
      idlFactory,
    },
  });
  const [loaded, setLoaded] = useState(false);
  const [renderLogin, setRenderLogin] = useState(false);

  useEffect(() => {
    if (!loaded) {
      if (auth.identity && auth.actor) {
        if (auth.isAuthenticated) {
          if (pathname.startsWith(ROUTES.login)) {
            router.replace(ROUTES.dashboard);
          }
        } else {
          if (!pathname.startsWith(ROUTES.login)) {
            router.replace(ROUTES.login);
            setRenderLogin(true);
          }
        }
        setLoaded(true);
      }
    }
  }, [loaded, auth, pathname, router]);

  if (
    (renderLogin && !pathname.startsWith(ROUTES.login)) ||
    (!renderLogin && pathname.startsWith(ROUTES.login))
  ) {
    // do not render anything if the pathname doesn't match the desired pages
    // to avoid a flash of content
    return null;
  }

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
