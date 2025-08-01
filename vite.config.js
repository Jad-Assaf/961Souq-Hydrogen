import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {vitePlugin as remix} from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import path from 'path'; // Import path for alias resolution

export default defineConfig({
  plugins: [
    tailwindcss({
      theme: {
        fontFamily: {
          sans: [
            'Montserrat',
            'system-ui',
            '-apple-system',
            'BlinkMacSystemFont',
            'Segoe UI',
            'Roboto',
            'Helvetica Neue',
            'Arial',
            'Noto Sans',
            'sans-serif',
          ],
        },
      },
    }),
    hydrogen(),
    oxygen(),
    remix({
      presets: [hydrogen.v3preset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
        v3_lazyRouteDiscovery: true,
        v3_singleFetch: true,
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'), // or 'src' if that’s your main directory
    },
  },
  build: {
    // rollupOptions: {
    //   external: [
    //     '~/components/icons',
    //     '~/components/checkbox',
    //     '~/lib/const',
    //     '~/lib/cn',
    //     '~/lib/filter',
    //   ],
    // },
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      /**
       * Include dependencies here if they throw CJS<>ESM errors.
       * For example, for the following error:
       *
       * > ReferenceError: module is not defined
       * >   at /Users/.../node_modules/example-dep/index.js:1:1
       *
       * Include 'example-dep' in the array below.
       * @see https://vitejs.dev/config/dep-optimization-options
       */
      include: [
        'react-social-media-embed',
        'algoliasearch',
        'use-sync-external-store/shim/index.js',
        'qs',
        '@algolia/events',
        'algoliasearch-helper',
        'react-dom/client',
        'react',
        'react-babylonjs',
        'scheduler',
        'react-reconciler',
        'use-sync-external-store/shim/with-selector.js',
        'react-reconciler/constants',
        'nano-css/addon/vcssom/cssToTree',
        'nano-css/addon/vcssom',
        'nano-css/addon/cssom',
        'nano-css',
        'copy-to-clipboard',
        'js-cookie',
        'fast-deep-equal/react',
        'lodash/debounce',
        'react-microsoft-clarity',
        'react-lazy-load-image-component',
        'prop-types',
        'matchmediaquery',
      ],
    },
  },
});
