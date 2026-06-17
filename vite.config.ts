import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "client",
  envDir: __dirname,
  publicDir: "../public",
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
        "0001-projects": resolve(__dirname, "client/0001-projects.html"),
        "open-source": resolve(__dirname, "client/open-source.html"),
        sentences: resolve(__dirname, "client/sentences.html"),
        thankyou: resolve(__dirname, "client/thank-you.html"),
        architecture: resolve(__dirname, "client/architecture.html"),
      },
    },
  },
});
