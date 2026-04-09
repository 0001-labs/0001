import { test, expect } from "@playwright/test";

function parseCssPx(value: string): number {
  return parseFloat(value.replace("px", ""));
}

test.describe("Home hero CTAs (mobile viewports)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/", { waitUntil: "networkidle" });
    await page.waitForFunction(() => {
      const sf = getComputedStyle(document.documentElement).getPropertyValue("--sf").trim();
      return sf !== "" && document.documentElement.classList.contains("mobile");
    });
  });

  test("See our services and See our past work use the same font-size", async ({
    page,
  }) => {
    const services = page.locator(".hero__buttons a.button");
    const pastWork = page.locator(".hero__buttons .hero__text-link");

    const fs = await services.evaluate((el) => getComputedStyle(el).fontSize);
    const fp = await pastWork.evaluate((el) => getComputedStyle(el).fontSize);

    expect(fs, "chartreuse CTA font-size").toBe(fp);
  });

  test("secondary CTA font-size matches 14 * --sf (px)", async ({ page }) => {
    const pastWork = page.locator(".hero__buttons .hero__text-link");
    const fp = await pastWork.evaluate((el) => getComputedStyle(el).fontSize);
    const sfRaw = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue("--sf").trim()
    );
    const sf = parseFloat(sfRaw || "1");
    const expected = 14 * sf;
    const got = parseCssPx(fp);
    expect(Math.abs(got - expected)).toBeLessThan(0.06);
  });
});
