type RouteType =
  | string
  | ((id: string) => RouteType)
  | ({ ROOT?: string } & Routes);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Routes extends Record<string, RouteType> {}

export const ROUTES = {
  dashboard: '/',
  login: '/login',
  fortuneWheel: '/fw',
} satisfies Routes;
