import { defineConfig, devices } from "@playwright/test";

/** iPhone presets default to WebKit; use Chromium with the same viewport/UA for CI without webkit install */
function chromiumMobile(
  preset: (typeof devices)[keyof typeof devices]
): Record<string, unknown> {
  return {
    browserName: "chromium" as const,
    viewport: preset.viewport,
    userAgent: preset.userAgent,
    deviceScaleFactor: preset.deviceScaleFactor,
    isMobile: preset.isMobile,
    hasTouch: preset.hasTouch,
  };
}

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: 0,
  reporter: "list",
  use: {
    baseURL: "http://localhost:5173",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "Pixel 5",
      use: { ...devices["Pixel 5"] },
    },
    {
      name: "iPhone 14",
      use: chromiumMobile(devices["iPhone 14"]),
    },
    {
      name: "iPhone SE",
      use: chromiumMobile(devices["iPhone SE"]),
    },
  ],
  webServer: {
    command: "bun run dev",
    url: "http://localhost:5173",
    reuseExistingServer: true,
  },
});
