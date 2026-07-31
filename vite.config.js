import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// If you deploy to GitHub Pages at https://<user>.github.io/<repo>/,
// set VITE_BASE_PATH="/<repo>/" as a build-time env var (see DEPLOY.md).
// Vercel/Netlify/custom domains should leave this as "/".
export default defineConfig({
  plugins: [react()],
  base: process.env.VITE_BASE_PATH || "/",
});
