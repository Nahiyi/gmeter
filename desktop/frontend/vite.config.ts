import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    strictPort: true,
    port: 5178
  },
  preview: {
    port: 4178
  },
  clearScreen: false
});
