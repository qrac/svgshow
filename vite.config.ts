import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"
import svgr from "vite-plugin-svgr"

const preactAlias = [
  {
    find: "react",
    replacement: "preact/compat",
  },
  {
    find: "react-dom",
    replacement: "preact/compat",
  },
]

export default defineConfig({
  plugins: [react(), svgr()],
  resolve: {
    alias: process.env.NODE_ENV === "production" ? preactAlias : [],
  },
  build: {
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name].js`,
        assetFileNames: `assets/[name][extname]`,
      },
    },
  },
})
