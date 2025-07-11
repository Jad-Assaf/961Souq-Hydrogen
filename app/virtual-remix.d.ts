// virtual-remix.d.ts
declare module 'virtual:remix/server-build' {
    import type { ServerBuild } from '@remix-run/server-runtime';
    const build: ServerBuild;
    export = build;
}
  