import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'lib',
      entryRoot: 'src',
      copyDtsFiles: false,
      exclude: [
        'src/**/*.test.ts',
        'src/main.ts'
      ]
    }),
  ],
  build: {
    outDir: 'lib',
    copyPublicDir: false,
    cssCodeSplit: true,
    lib: {
      entry: {
        index: resolve(__dirname, 'src/index.ts'),
        'directional-hover': resolve(__dirname, 'src/plugins/directional-hover/index.ts')
      },
      formats: ['es']
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name][extname]'
      }
    }
  }
})
