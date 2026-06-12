import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import type { Plugin } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import sirv from 'sirv'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '../..')
const cesiumPath = path.join(repoRoot, 'node_modules/cesium/Build/Cesium')
const cesiumBaseUrl = 'cesium'

function cesiumAssetsPlugin(): Plugin {
  let outDir = 'dist'
  let isBuild = false

  return {
    name: 'cesium-assets',
    config(_config, { command }) {
      isBuild = command === 'build'
      return {
        define: {
          CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}/`),
        },
      }
    },
    configResolved(resolved) {
      outDir = path.resolve(resolved.root, resolved.build.outDir)
    },
    configureServer({ middlewares }) {
      middlewares.use(
        `/${cesiumBaseUrl}`,
        sirv(cesiumPath, {
          dev: true,
          etag: true,
          setHeaders(res) {
            res.setHeader('Access-Control-Allow-Origin', '*')
          },
        }),
      )
    },
    async closeBundle() {
      if (!isBuild) {
        return
      }

      const destination = path.join(outDir, cesiumBaseUrl)
      await fs.mkdir(destination, { recursive: true })

      for (const directory of ['Assets', 'ThirdParty', 'Workers', 'Widgets']) {
        await fs.cp(
          path.join(cesiumPath, directory),
          path.join(destination, directory),
          { recursive: true },
        )
      }

      await fs.copyFile(
        path.join(cesiumPath, 'Cesium.js'),
        path.join(destination, 'Cesium.js'),
      )
    },
  }
}

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    cesiumAssetsPlugin(),
  ],
})

export default config
