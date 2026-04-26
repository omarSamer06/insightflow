import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const apiBaseUrl = env.VITE_API_BASE_URL || "/api";

  // Only proxy when using relative "/api" and backend URL provided via env.
  const proxyTarget = env.VITE_BACKEND_URL;
  const shouldProxy = apiBaseUrl === "/api" && Boolean(proxyTarget);

  return {
    plugins: [react()],
    server: shouldProxy
      ? {
          proxy: {
            "/api": {
              target: proxyTarget,
              changeOrigin: true,
              secure: true,
            },
          },
        }
      : undefined,
  };
});
