import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
/// <reference types="vitest/config" />
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
const require = createRequire(import.meta.url)
const cesiumVersion = (
  require(path.join(repoRoot, 'node_modules/cesium/package.json')) as {
    version: string
  }
).version
const cesiumCdnBase = `https://cdn.jsdelivr.net/npm/cesium@${cesiumVersion}/Build/Cesium/`

function cesiumAssetsPlugin(): Plugin {
  let isBuild = false

  return {
    name: 'cesium-assets',
    config(_config, { command }) {
      isBuild = command === 'build'
      // Production loads the prebuilt Cesium script, workers, and default
      // starfield from jsDelivr. The free Render instance was serving the
      // uncompressed 5.6MB Cesium.js itself, which took over a minute.
      const runtimeBase = isBuild ? cesiumCdnBase : `/${cesiumBaseUrl}/`
      return {
        define: {
          CESIUM_BASE_URL: JSON.stringify(`/${cesiumBaseUrl}/`),
          __CESIUM_RUNTIME_BASE__: JSON.stringify(runtimeBase),
        },
      }
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
      // Only the client output is served as static files in production.
      if (!isBuild || this.environment.name !== 'client') {
        return
      }

      const { root, build } = this.environment.config
      const destination = path.join(
        path.resolve(root, build.outDir),
        cesiumBaseUrl,
      )
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
  worker: {
    format: 'es',
  },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    cesiumAssetsPlugin(),
  ],
  test: {
    environment: 'node',
  },
})

export default config
