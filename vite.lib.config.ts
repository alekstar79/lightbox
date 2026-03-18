import { defineConfig } from 'vite'
import { resolve } from 'path'
import dts from 'vite-plugin-dts'

export default defineConfig({
  plugins: [
    dts({
      insertTypesEntry: true,
      outDir: 'lib',
      exclude: [
        'src/__tests__',
        'src/**/*.test.ts',
        'src/main.ts'
      ],
      entryRoot: 'src',
      copyDtsFiles: false
    })
  ],
  build: {
    outDir: 'lib',
    copyPublicDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'Lightbox',
      fileName: 'index',
      formats: ['es']
    },
    rolldownOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          if (assetInfo.names?.includes('index.css')) {
            return 'styles.css'
          }

          return '[name].[ext]'
        }
      }
    }
  }
})
