import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // server: {
  //   proxy: {
  //     '/api': {
  //       target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  //       changeOrigin: true,
  //     },
  //     '/v1': {
  //       target: process.env.VITE_API_BASE_URL || 'http://localhost:3000',
  //       changeOrigin: true,
  //     },
  //   },
  // },
  server: {
    port: 3000,
    host: "0.0.0.0",
    proxy: {
      "/local": {
        target: "https://api-yuanshu.vibe3.ai/",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/local/, ""),
        configure: (proxy) => {
          proxy.on("proxyReq", (proxyReq, req) => {
            const targetHost = proxyReq.getHeader("host");
            const targetPath = proxyReq.path;
            console.log(
              "[proxy]",
              req.method,
              req.url,
              "->",
              `https://${targetHost}${targetPath}`,
            );
          });
        },
      },
    },
  },
});
