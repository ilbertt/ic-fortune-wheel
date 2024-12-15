type RouteType =
  | string
  | ((id: string) => RouteType)
  | ({ ROOT?: string } & Routes);

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Routes extends Record<string, RouteType> {}

export const ROUTES = {
  dashboard: {
    ROOT: '/admin',
    assets: '/admin/assets',
    team: '/admin/team',
    design: '/admin/design',
  },
  login: '/login',
  fortuneWheel: '/fw',
} satisfies Routes;
