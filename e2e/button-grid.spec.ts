import { test, expect } from "@playwright/test";

// US-002 — Use an on-screen button grid for digits and operators.
// Each spec is named after the acceptance criterion it proves and drives the
// calculator the way a visitor would: pointer clicks on the rendered grid.

const EXPECTED_LABELS = [
  "0",
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "Decimal point",
  "Add",
  "Subtract",
  "Multiply",
  "Divide",
  "Equals",
  "Clear",
  "Percent",
  "Flip sign",
  "Backspace",
];

test.beforeEach(async ({ page }) => {
  await page.goto("/calculator");
  await expect(page.getByRole("status")).toHaveText("0");
});

test("AC-005: grid exposes every required button and no other function buttons", async ({
  page,
}) => {
  for (const label of EXPECTED_LABELS) {
    await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible();
  }

  // No control beyond the agreed roster is on the page.
  await expect(page.getByRole("button")).toHaveCount(EXPECTED_LABELS.length);
});

test("AC-006: tapping a button applies its action exactly once with visible feedback", async ({
  page,
}) => {
  const seven = page.getByRole("button", { name: "7", exact: true });

  await seven.click();
  // One tap enters a single digit — the action ran once, not twice.
  await expect(page.getByRole("status")).toHaveText("7");

  // A full pointer-only calculation resolves correctly: 7 x 6 = 42.
  await page.getByRole("button", { name: "Multiply", exact: true }).click();
  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("button", { name: "Equals", exact: true }).click();
  await expect(page.getByRole("status")).toHaveText("42");
});

test("AC-007: operators are visually distinguishable from digits", async ({
  page,
}) => {
  const digitColor = await page
    .getByRole("button", { name: "7", exact: true })
    .evaluate((el) => getComputedStyle(el).backgroundColor);

  const operatorColor = await page
    .getByRole("button", { name: "Add", exact: true })
    .evaluate((el) => getComputedStyle(el).backgroundColor);

  expect(operatorColor).not.toBe(digitColor);
});
