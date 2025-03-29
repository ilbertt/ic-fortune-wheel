'use client';

import { createContext, useContext, useEffect } from 'react';
import { useAuthClient } from '@dfinity/use-auth-client';
import { idlFactory } from '@/declarations/backend';
import { usePathname, useRouter } from 'next/navigation';
import { ROUTES } from '@/lib/routes';
import { type ActorSubclass } from '@dfinity/agent';
import { type _SERVICE } from '@/declarations/backend/backend.did';
import { canisterId } from '@/lib/api';

const IS_LOCAL = process.env.DFX_NETWORK === 'local';
const IS_PRODUCTION = process.env.DFX_NETWORK === 'ic';
const PRODUCTION_FRONTEND_ORIGIN = `https://${process.env.CANISTER_ID_FRONTEND}.icp0.io`;
const IDENTITY_PROVIDER_URL = IS_LOCAL
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
        identityProvider: IDENTITY_PROVIDER_URL,
        maxTimeToLive:
          BigInt(3) * BigInt(24 * 60 * 60) * BigInt(1000 * 1000 * 1000), // 3 days in nanoseconds
        derivationOrigin:
          // handle custom domain to avoid generating a different principal
          // see https://github.com/dfinity/internet-identity/blob/main/docs/ii-spec.mdx#alternative-frontend-origins
          IS_PRODUCTION &&
          typeof window !== 'undefined' &&
          window.location.origin !== PRODUCTION_FRONTEND_ORIGIN
            ? PRODUCTION_FRONTEND_ORIGIN
            : undefined,
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
