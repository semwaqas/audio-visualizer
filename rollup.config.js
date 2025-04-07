import PeerDepsExternalPlugin from 'rollup-plugin-peer-deps-external';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import postcss from 'rollup-plugin-postcss';
import dts from 'rollup-plugin-dts';
import swc from '@rollup/plugin-swc';

const packageJson = require('./package.json');

export default [
    {
        input: 'src/index.ts',
        output: [
            {
                file: packageJson.main,
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: packageJson.module,
                format: 'esm',
                sourcemap: true,
            }
        ],
        plugins: [
            resolve(),
            commonjs(),
            PeerDepsExternalPlugin(),
            postcss({
                extract: true,  // Extract CSS to a separate file
                modules: true,  // Enable CSS modules
                autoModules: true,
                minimize: true,
                extensions: ['.css']
            }),
            typescript({ 
                tsconfig: './tsconfig.json',
                sourceMap: true 
            }),
            swc({
                include: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
                sourceMaps: 'inline',
                jsc: {
                    parser: { syntax: 'typescript', tsx: true },
                    transform: { react: { runtime: 'automatic' } },
                },
            }),
            terser(),
        ],
        external: ['react', 'react-dom', 'react/jsx-runtime', 'react-compare-slider'],
    },
    {
        input: 'src/index.ts',
        output: [{ file: packageJson.types }],
        plugins: [dts.default()],
        external: [/\.css$/],
    }
];