import { string } from 'rollup-plugin-string';
import terser from '@rollup/plugin-terser';
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'core/index.js',
  output: {
    file: 'app/tizenportal.js',
    format: 'iife',
    name: 'TizenPortal',
    sourcemap: false,
  },
  plugins: [
    // Import CSS files as strings
    string({
      include: '**/*.css',
    }),

    // Resolve imports from node_modules
    nodeResolve({
      browser: true,
      preferBuiltins: false,
    }),

    // Convert CommonJS modules to ES modules
    commonjs({
      include: [/node_modules/],
      transformMixedEsModules: true,
    }),

    // Transpile to ES5 for Chrome 47+ compatibility
    // Using transform plugin (not output plugin) for IIFE format
    babel({
      babelHelpers: 'bundled',
      presets: [
        ['@babel/preset-env', {
          targets: {
            chrome: '47',
          },
          modules: false,
        }],
      ],
      exclude: 'node_modules/**',
    }),

    // Minify for production
    terser({
      ecma: 5,
      mangle: true,
      compress: {
        drop_console: false, // Keep console.log for diagnostics
      },
    }),
  ],
};
