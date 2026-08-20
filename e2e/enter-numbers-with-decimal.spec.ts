import { test, expect } from "@playwright/test";

// US-003 — Enter numbers with digits and a decimal point.
// The calculator runs entirely in the browser, so no sign-in is needed to
// exercise these flows; a visitor simply opens the calculator screen.

test.beforeEach(async ({ page }) => {
  await page.goto("/calculator");
  await expect(page.getByRole("status")).toHaveText("0");
});

test("AC-008: pressing 5 then 2 shows 52 with no leading zero", async ({ page }) => {
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("5");

  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("52");
});

test("AC-009: with 12 shown, decimal point then 5 shows 12.5", async ({ page }) => {
  await page.getByRole("button", { name: "1", exact: true }).click();
  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("12");

  await page.getByRole("button", { name: "Decimal point" }).click();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("12.5");
});

test("AC-010: with 12.5 shown, a second decimal point leaves it unchanged", async ({ page }) => {
  await page.getByRole("button", { name: "1", exact: true }).click();
  await page.getByRole("button", { name: "2", exact: true }).click();
  await page.getByRole("button", { name: "Decimal point" }).click();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("12.5");

  await page.getByRole("button", { name: "Decimal point" }).click();
  await expect(page.getByRole("status")).toHaveText("12.5");
});

test("AC-011: pressing the decimal point first shows 0.", async ({ page }) => {
  await page.getByRole("button", { name: "Decimal point" }).click();
  await expect(page.getByRole("status")).toHaveText("0.");

  await page.getByRole("button", { name: "7", exact: true }).click();
  await page.getByRole("button", { name: "5", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("0.75");
});
