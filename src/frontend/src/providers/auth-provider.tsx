import { useAuthClient } from '@dfinity/use-auth-client';
import { type ActorSubclass } from '@icp-sdk/core/agent';
import { type _SERVICE, idlFactory } from '@/declarations/backend/backend.did';
import { canisterId } from '@/lib/api';
import { AuthContext } from '@/contexts/auth-context';

const IS_LOCAL = import.meta.env.VITE_DFX_NETWORK === 'local';
const IS_PRODUCTION =
  import.meta.env.VITE_DFX_NETWORK === 'ic' ||
  import.meta.env.VITE_DFX_NETWORK === 'staging';
const PRODUCTION_FRONTEND_ORIGIN = `https://${canisterId}.icp0.io`;
const IDENTITY_PROVIDER_URL = IS_LOCAL
  ? `http://${import.meta.env.VITE_CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`
  : 'https://identity.internetcomputer.org';

type AuthProviderProps = {
  children: React.ReactNode;
};

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const { actor, identity, isAuthenticated, authClient, login, logout } =
    useAuthClient({
      loginOptions: {
        identityProvider: IDENTITY_PROVIDER_URL,
        maxTimeToLive:
          BigInt(3) * BigInt(24 * 60 * 60) * BigInt(1000 * 1000 * 1000), // 3 days in nanoseconds
        derivationOrigin:
          // handle custom domain to avoid generating a different principal
          // see https://github.com/dfinity/internet-identity/blob/main/docs/ii-spec.mdx#alternative-frontend-origins
          IS_PRODUCTION && window.location.origin !== PRODUCTION_FRONTEND_ORIGIN
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

  // Typescript doesn't know that authClient can be null. In this case, the
  // auth has not been initialized yet, so we don't render the AuthProvider.
  if (!authClient) {
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
