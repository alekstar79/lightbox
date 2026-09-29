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
        'src/main.ts',
        'src/styles/theme-*.scss'
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
        'directional-hover': resolve(__dirname, 'src/plugins/directional-hover/index.ts'),
        'theme-dark': resolve(__dirname, 'src/styles/theme-dark.scss'),
        'theme-minimal': resolve(__dirname, 'src/styles/theme-minimal.scss'),
        'theme-glass': resolve(__dirname, 'src/styles/theme-glass.scss')
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
