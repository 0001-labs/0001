import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "client",
  publicDir: "../public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "client/index.html"),
        about: resolve(__dirname, "client/about.html"),
        legal: resolve(__dirname, "client/legal.html"),
        tokushoho: resolve(__dirname, "client/tokushoho.html"),
        services: resolve(__dirname, "client/services.html"),
        contact: resolve(__dirname, "client/contact.html"),
        products: resolve(__dirname, "client/products.html"),
        sentences: resolve(__dirname, "client/sentences.html"),
        tasklog: resolve(__dirname, "client/task-log.html"),
        thankyou: resolve(__dirname, "client/thank-you.html"),
        architecture: resolve(__dirname, "client/architecture.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
