import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web/dist/cjs/index.js'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
  },
});
