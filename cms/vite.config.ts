import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { readFileSync } from "fs";

const packageJson = JSON.parse(readFileSync("./package.json", "utf-8"));

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
  },
  define: {
    "import.meta.env.VITE_VERSION_NAME": JSON.stringify(packageJson.version),
  },
  server: {
    port: 3001,
    open: true,
  },
});
