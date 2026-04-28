import { ConvexReactClient } from "convex/react";

const url = import.meta.env.VITE_CONVEX_URL?.trim();

export const convexUrl = url ?? null;
export const isConvexConfigured = Boolean(url);

if (!url) {
  // Don't crash the bundle at build time; surface the error at runtime instead.
  // eslint-disable-next-line no-console
  console.error("VITE_CONVEX_URL is not set. Link cannot talk to Convex.");
}

export const convex = new ConvexReactClient(url ?? "https://invalid.invalid");
