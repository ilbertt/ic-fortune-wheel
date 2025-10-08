import { useAuthClient } from '@dfinity/use-auth-client';
import { canisterId } from '@/lib/api';
import { AuthContext } from '@/contexts/auth-context';
import { createActor } from '@/lib/api/backend/backend';

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
  const { identity, isAuthenticated, authClient, login, logout } =
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
    });

  // Typescript doesn't know that authClient can be null. In this case, the
  // auth has not been initialized yet, so we don't render the AuthProvider.
  if (!authClient) {
    return null;
  }

  return (
    <AuthContext.Provider
      value={{
        actor: createActor(canisterId, {
          agentOptions: {
            identity: identity || undefined,
            shouldFetchRootKey: IS_LOCAL,
          },
        }),
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
