import typescript from '@rollup/plugin-typescript';
import { eslint } from 'rollup-plugin-eslint';
import pkg from './package.json';

export default {
  input: 'src/index.ts',
  external: ['axios'],
  plugins: [
    eslint({
      throwOnWarning: true,
      throwOnError: true,
    }),
    typescript(),
  ],
  output: [
    {
      file: pkg.main,
      format: 'cjs',
      exports: 'named',
    },
    {
      file: pkg.module,
      format: 'esm',
      exports: 'named',
    },
  ],
};
