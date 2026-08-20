import { test, expect } from "@playwright/test";

// US-003: Enter numbers with digits and a decimal point.
// Each spec is named after the acceptance criterion it proves and drives the
// calculator page the way a visitor would — clicking keys and reading the display.

test.beforeEach(async ({ page }) => {
  await page.goto("/calculator");
});

const display = (page: import("@playwright/test").Page) => page.getByRole("status");
const key = (page: import("@playwright/test").Page, name: string) =>
  page.getByRole("button", { name });

test("AC-008: pressing 5 then 2 shows 52 with no leading zero", async ({ page }) => {
  await expect(display(page)).toHaveText("0");
  await key(page, "5").click();
  await key(page, "2").click();
  await expect(display(page)).toHaveText("52");
});

test("AC-009: from 12, decimal then 5 shows 12.5", async ({ page }) => {
  await key(page, "1").click();
  await key(page, "2").click();
  await expect(display(page)).toHaveText("12");
  await key(page, "Decimal point").click();
  await key(page, "5").click();
  await expect(display(page)).toHaveText("12.5");
});

test("AC-010: a second decimal point leaves 12.5 unchanged", async ({ page }) => {
  await key(page, "1").click();
  await key(page, "2").click();
  await key(page, "Decimal point").click();
  await key(page, "5").click();
  await expect(display(page)).toHaveText("12.5");
  await key(page, "Decimal point").click();
  await expect(display(page)).toHaveText("12.5");
});

test("AC-011: decimal point first shows 0. so 0.75 can be entered", async ({ page }) => {
  await key(page, "Decimal point").click();
  await expect(display(page)).toHaveText("0.");
  await key(page, "7").click();
  await key(page, "5").click();
  await expect(display(page)).toHaveText("0.75");
});
