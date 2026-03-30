import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {reactRouter} from '@react-router/dev/vite';
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
    reactRouter(),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      '~': path.resolve(__dirname, 'app'), // or 'src' if that’s your main directory
      '@remix-run/react': 'react-router',
      '@shopify/remix-oxygen': path.resolve(
        __dirname,
        'app/lib/remixOxygenCompat.js',
      ),
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
        'set-cookie-parser',
        'cookie',
        'typesense',
        'ts-easing',
        'fast-shallow-equal',
        'react-universal-interface',
        'screenfull',
        'react-social-media-embed',
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
