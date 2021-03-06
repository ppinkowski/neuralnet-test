import resolve from 'rollup-plugin-node-resolve';
import babel from 'rollup-plugin-babel';
import commonjs from 'rollup-plugin-commonjs';

export default {
  input: 'app.js',
  output: {
    file: 'build/bundle.js',
    format: 'cjs'
  },
  sourceMap: true,
  plugins: [
    babel({
        exclude: 'node_modules/**'
    }),
    resolve({
      module: false
    }),
    commonjs({
      include: 'node_modules/**'
    })
  ]
};