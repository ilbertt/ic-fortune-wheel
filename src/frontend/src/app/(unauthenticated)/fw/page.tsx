import { LoaderPinwheel } from 'lucide-react';

export default function Page() {
  return (
    <div className="bg-dark-infinite flex h-screen w-screen flex-col items-center justify-center gap-8">
      <h1 className="text-4xl">Fortune Wheel display</h1>
      <p>
        <LoaderPinwheel className="size-52 animate-[spin_5s_linear_infinite]" />
      </p>
    </div>
  );
}
