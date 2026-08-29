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
    })
  ],
  build: {
    outDir: 'lib',
    copyPublicDir: false,
    lib: {
      name: 'Lightbox',
      fileName: 'index',
      entry: resolve(__dirname, 'src/index.ts'),
      formats: ['es']
    },
    rollupOptions: {
      output: {
        assetFileNames: (assetInfo) => {
          const cssName = assetInfo.names?.find(name => name.endsWith('.css'))

          if (cssName) {
            return 'styles.css'
          }

          return '[name].[ext]'
        }
      }
    }
  }
})
