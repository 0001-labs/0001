import { defineConfig } from "vite";
import { resolve } from "path";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "client",
  envDir: __dirname,
  publicDir: "../public",
  plugins: [react()],
  build: {
    outDir: "../dist",
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, "client/index.html"),
        about: resolve(__dirname, "client/about.html"),
        legal: resolve(__dirname, "client/legal.html"),
        privacy: resolve(__dirname, "client/privacy.html"),
        terms: resolve(__dirname, "client/terms.html"),
        "data-deletion": resolve(__dirname, "client/data-deletion.html"),
        tokushoho: resolve(__dirname, "client/tokushoho.html"),
        services: resolve(__dirname, "client/services.html"),
        contact: resolve(__dirname, "client/contact.html"),
        products: resolve(__dirname, "client/products.html"),
        sentences: resolve(__dirname, "client/sentences.html"),
        thankyou: resolve(__dirname, "client/thank-you.html"),
        architecture: resolve(__dirname, "client/architecture.html"),
        // "client-login" entry is included below; requires `bunx convex dev` to
        // have generated convex/_generated/ before vite build can resolve it.
        "client-login": resolve(__dirname, "client/client-login/index.html"),
      },
    },
  },
  server: {
    open: true,
  },
});
