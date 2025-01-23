import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

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
  plugins: [react()],
  resolve: {
    alias: process.env.NODE_ENV === "production" ? preactAlias : [],
  },
})
