'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthClient } from '@dfinity/use-auth-client';
import { idlFactory, canisterId } from '@/declarations/backend';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { type ActorSubclass } from '@dfinity/agent';
import { type _SERVICE } from '@/declarations/backend/backend.did';

const identityProvider =
  process.env.DFX_NETWORK === 'local'
    ? `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
    : 'https://identity.ic0.app';

type AuthContextType = Omit<
  ReturnType<typeof useAuthClient>,
  'actor' | 'actors'
> & {
  actor: ActorSubclass<_SERVICE>;
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const pathname = usePathname();
  const router = useRouter();
  const { actor, identity, isAuthenticated, authClient, login, logout } =
    useAuthClient({
      loginOptions: {
        identityProvider,
        maxTimeToLive:
          BigInt(3) * BigInt(24 * 60 * 60) * BigInt(1000 * 1000 * 1000), // 3 days in nanoseconds
      },
      createOptions: {
        idleOptions: {
          disableIdle: true,
        },
      },
      actorOptions: {
        canisterId,
        idlFactory,
      },
    });

  useEffect(() => {
    if (identity && actor) {
      if (isAuthenticated) {
        if (pathname.startsWith(ROUTES.login) || pathname === '/') {
          router.replace(ROUTES.dashboard.ROOT);
        }
      } else {
        if (pathname.startsWith(ROUTES.dashboard.ROOT) || pathname === '/') {
          router.replace(ROUTES.login);
        }
      }
    }
  }, [identity, actor, isAuthenticated, pathname, router]);

  if (
    // the fortune wheel page is always accessible
    !pathname.startsWith(ROUTES.fortuneWheel) &&
    ((isAuthenticated && !pathname.startsWith(ROUTES.dashboard.ROOT)) ||
      (!isAuthenticated && !pathname.startsWith(ROUTES.login)))
  ) {
    // do not render anything if the pathname doesn't match the desired pages
    // to avoid a flash of content
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        actor: actor as unknown as ActorSubclass<_SERVICE>,
        authClient,
        identity,
        isAuthenticated,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => useContext(AuthContext);
