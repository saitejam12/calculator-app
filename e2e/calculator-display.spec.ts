import { test, expect } from "@playwright/test";

// End-to-end proof of US-001, one spec per acceptance criterion. These are skipped
// because this repository was provided without an e2e harness for the calculator
// route: no Playwright config/baseURL and no login helper for the JWT-authenticated
// app, so the flow cannot be driven the way a person would from here. The full flow
// is retained below so it can be enabled once that harness exists; AC-001..AC-004
// are meanwhile covered at the component level in Calculator.display.test.tsx.

test.describe("US-001 — result display", () => {
  test.skip(
    "AC-001: on first load a single display shows 0 and no other value — needs e2e auth/route/baseURL setup not available here",
    async ({ page }) => {
      await page.goto("/calculator");
      const displays = page.getByRole("status");
      await expect(displays).toHaveCount(1);
      await expect(displays).toHaveText("0");
    },
  );

  test.skip(
    "AC-002: pressing digit keys shows exactly the number entered — needs e2e auth/route/baseURL setup not available here",
    async ({ page }) => {
      await page.goto("/calculator");
      await page.getByRole("button", { name: "4" }).click();
      await page.getByRole("button", { name: "2" }).click();
      await page.getByRole("button", { name: "0" }).click();
      await expect(page.getByRole("status")).toHaveText("420");
    },
  );

  test.skip(
    "AC-003: a completed calculation shows only the result, no history line — needs e2e auth/route/baseURL setup not available here",
    async ({ page }) => {
      await page.goto("/calculator");
      await page.getByRole("button", { name: "2" }).click();
      await page.getByRole("button", { name: "Add" }).click();
      await page.getByRole("button", { name: "3" }).click();
      await page.getByRole("button", { name: "Equals" }).click();
      await expect(page.getByRole("status")).toHaveText("5");
      await expect(page.getByRole("status")).toHaveCount(1);
    },
  );

  test.skip(
    "AC-004: a long value stays within the display without breaking the layout — needs e2e auth/route/baseURL setup not available here",
    async ({ page }) => {
      await page.goto("/calculator");
      for (const d of ["1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "1", "2"]) {
        await page.getByRole("button", { name: d }).click();
      }
      await expect(page.getByRole("status")).toHaveText("123456789012");
      // The document must not develop horizontal overflow from the long value.
      const overflows = await page.evaluate(
        () => document.documentElement.scrollWidth > document.documentElement.clientWidth,
      );
      expect(overflows).toBe(false);
    },
  );
});
