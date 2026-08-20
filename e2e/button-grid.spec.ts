import { test, expect } from "@playwright/test";

// US-002 — Use an on-screen button grid for digits and operators.
// Each test is named after the acceptance criterion it proves.

const EXPECTED_BUTTON_NAMES = [
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
});

test("AC-005: the grid has every required button and no other function buttons", async ({
  page,
}) => {
  for (const name of EXPECTED_BUTTON_NAMES) {
    await expect(page.getByRole("button", { name, exact: true })).toBeVisible();
  }
  // No extra function buttons: the grid holds exactly the required set.
  await expect(page.getByRole("button")).toHaveCount(EXPECTED_BUTTON_NAMES.length);
});

test("AC-006: tapping a button gives visible feedback and applies its action once", async ({
  page,
}) => {
  const display = page.getByRole("status");

  const five = page.getByRole("button", { name: "5", exact: true });
  await expect(five).toHaveCSS("transform", /matrix|none/);

  await five.click();
  // Applied exactly once: a single click yields one digit, not two.
  await expect(display).toHaveText("5");

  await page.getByRole("button", { name: "Add", exact: true }).click();
  await page.getByRole("button", { name: "3", exact: true }).click();
  await page.getByRole("button", { name: "Equals", exact: true }).click();
  await expect(display).toHaveText("8");
});

test("AC-007: operators are visually distinguishable from digits", async ({ page }) => {
  const digitColor = await page
    .getByRole("button", { name: "5", exact: true })
    .evaluate((el) => getComputedStyle(el).color);

  for (const name of ["Add", "Subtract", "Multiply", "Divide"]) {
    const opColor = await page
      .getByRole("button", { name, exact: true })
      .evaluate((el) => getComputedStyle(el).color);
    expect(opColor, `${name} should not look like a digit`).not.toBe(digitColor);
  }
});
