import { PageLayout } from './layouts';
import { Loader } from './loader';

export const LoadingPage = () => {
  return (
    <PageLayout className="relative h-screen">
      <Loader className="absolute left-1/2 top-1/2 size-20 -translate-x-1/2 -translate-y-1/2" />
    </PageLayout>
  );
};
