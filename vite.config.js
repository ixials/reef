import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// Replace YOUR_REPO_NAME with your actual GitHub repo name
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: "/reef/",
});
