import { LoaderPinwheel } from 'lucide-react';
import { AuthForm } from './AuthForm';

export default function AuthenticationPage() {
  return (
    <div className="container relative flex min-h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0">
      <div className="left-0 top-0 z-20 flex w-screen items-center justify-center gap-2 p-5 text-lg font-medium md:absolute md:justify-start md:p-10">
        <LoaderPinwheel className="size-6" />
        Fortune Wheel
      </div>
      <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
        <div className="bg-dark-infinite absolute inset-0" />
        <div className="relative top-1/2 z-20 flex -translate-y-1/2 flex-col gap-5">
          <h1 className="bg-gradient-to-r from-white to-[#c572ef] bg-clip-text text-4xl font-extrabold text-transparent">
            Try your luck and win great Internet Computer prizes
          </h1>
          <p className="text-base font-normal">
            Create your Internet Identity, get a cross-chain wallet and interact
            with a Web3 platform built 100% On-chain thanks to Internet Computer
          </p>
        </div>
      </div>
      <div className="relative flex h-full flex-1 flex-col items-center justify-center">
        <div className="flex w-full flex-1 flex-col items-center justify-center space-y-6">
          <div className="flex flex-col space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              🎉
              <br />
              Welcome aboard!
            </h1>
            <p className="text-muted-foreground text-sm">
              Use your Internet Identity to access the Admin dashboard
            </p>
          </div>
          <AuthForm />
        </div>
        <p className="text-muted-foreground mb-10 w-full px-8 text-center text-sm md:absolute md:bottom-10">
          Developed with 💜 by ICP HUB Italy & Ticino
        </p>
      </div>
    </div>
  );
}
