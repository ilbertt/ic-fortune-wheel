import { cn } from '@/lib/utils';

type MainLayoutProps = React.HTMLAttributes<HTMLDivElement>;

export const PageLayout: React.FC<MainLayoutProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'grid gap-3 md:gap-4',
        "grid-cols-4 [grid-template-areas:'header_header_header_header''subheader_subheader_subheader_subheader''content_content_content_content']",
        "md:grid-cols-12 md:[grid-template-areas:'header_header_header_header_header_header_header_header_header_header_header_header''subheader_subheader_subheader_subheader_subheader_subheader_subheader_subheader_subheader_subheader_subheader_subheader''content_content_content_content_content_content_content_content_content_content_content_content']",
        'p-4 pt-3 md:p-8 md:pt-6',
        className,
      )}
      {...props}
    />
  );
};

type PageHeaderProps = React.HTMLAttributes<HTMLDivElement> & {
  title: string;
  rightContent?: React.ReactNode;
};

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  rightContent,
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'flex flex-row flex-wrap items-center justify-between [grid-area:header]',
        className,
      )}
      {...props}
    >
      <h1 className="text-3xl font-bold">{title}</h1>
      {rightContent}
    </div>
  );
};

type PageSubheaderProps = React.HTMLAttributes<HTMLDivElement>;

export const PageSubheader: React.FC<PageSubheaderProps> = ({
  className,
  ...props
}) => {
  return <div className={cn('[grid-area:subheader]', className)} {...props} />;
};

type PageContentProps = React.HTMLAttributes<HTMLDivElement>;

export const PageContent: React.FC<PageContentProps> = ({
  className,
  ...props
}) => {
  return (
    <div
      className={cn(
        'grid grid-cols-subgrid space-y-4 [grid-area:content] md:space-y-0',
        className,
      )}
      {...props}
    />
  );
};
