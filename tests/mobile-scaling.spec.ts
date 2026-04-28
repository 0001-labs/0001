import { expect, test } from "@playwright/test";

function parseCssPx(value: string): number {
  return parseFloat(value.replace("px", ""));
}

async function waitForMobileScaling(page: any): Promise<number> {
  await page.waitForFunction(() => {
    const sf = getComputedStyle(document.documentElement).getPropertyValue("--sf").trim();
    return sf !== "";
  });

  return page.evaluate(() =>
    parseFloat(getComputedStyle(document.documentElement).getPropertyValue("--sf").trim() || "1")
  );
}

test.describe("viewport-driven mobile activation", () => {
  test.use({
    viewport: { width: 390, height: 844 },
    isMobile: false,
    hasTouch: false,
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36",
  });

  test("narrow viewport enables html.mobile and scaling without mobile UA", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    const sf = await waitForMobileScaling(page);
    const isMobileClass = await page.evaluate(() =>
      document.documentElement.classList.contains("mobile")
    );

    expect(isMobileClass).toBe(true);
    expect(sf).toBeGreaterThan(1);
  });
});

test.describe("representative mobile scaling surfaces", () => {
  test("home burger menu appears and opens on mobile", async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await waitForMobileScaling(page);

    const toggle = page.locator("#home-menu-toggle");
    const panel = page.locator("#home-menu-mobile-panel");

    await expect(toggle).toBeVisible();
    await expect(panel).toBeHidden();

    await toggle.click();

    await expect(panel).toBeVisible();
  });

  test("about title scales to 40 * --sf", async ({ page }) => {
    await page.goto("/about", { waitUntil: "networkidle" });
    const sf = await waitForMobileScaling(page);
    const fontSize = await page.locator(".about-title").evaluate((el) => getComputedStyle(el).fontSize);

    expect(Math.abs(parseCssPx(fontSize) - (40 * sf))).toBeLessThan(0.1);
  });

  test("services title scales to 32 * --sf", async ({ page }) => {
    await page.goto("/services", { waitUntil: "networkidle" });
    const sf = await waitForMobileScaling(page);
    const fontSize = await page
      .locator(".services-title")
      .evaluate((el) => getComputedStyle(el).fontSize);

    expect(Math.abs(parseCssPx(fontSize) - (32 * sf))).toBeLessThan(0.1);
  });

  test("contact title scales to 40 * --sf", async ({ page }) => {
    await page.goto("/contact", { waitUntil: "networkidle" });
    const sf = await waitForMobileScaling(page);
    const fontSize = await page.locator(".contact-title").evaluate((el) => getComputedStyle(el).fontSize);

    expect(Math.abs(parseCssPx(fontSize) - (40 * sf))).toBeLessThan(0.1);
  });
});
