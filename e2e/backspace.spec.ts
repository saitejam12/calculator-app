import { test, expect } from "@playwright/test";

// US-004 — Delete the last digit with backspace. Each spec drives the calculator
// screen the way a visitor would: clicking the keys and reading the display.
// The display is the aria-live status region; the ⌫ key exposes aria-label
// "Backspace", operators "Add"/"Equals" and the decimal key "Decimal point".

test.beforeEach(async ({ page }) => {
  await page.goto("/calculator");
});

function display(page: import("@playwright/test").Page) {
  return page.getByRole("status");
}

function key(page: import("@playwright/test").Page, name: string) {
  return page.getByRole("button", { name, exact: true });
}

test("AC-012: backspace on 123 shows 12 and keeps the pending calculation", async ({ page }) => {
  await key(page, "5").click();
  await key(page, "Add").click();
  await key(page, "1").click();
  await key(page, "2").click();
  await key(page, "3").click();
  await expect(display(page)).toHaveText("123");

  await key(page, "Backspace").click();
  await expect(display(page)).toHaveText("12");

  // The rest of the state is unchanged: 5 + 12 completes to 17.
  await key(page, "Equals").click();
  await expect(display(page)).toHaveText("17");
});

test("AC-013: backspace on 7 shows 0 and treats the entry as empty", async ({ page }) => {
  await key(page, "7").click();
  await expect(display(page)).toHaveText("7");

  await key(page, "Backspace").click();
  await expect(display(page)).toHaveText("0");

  // Empty entry: the next digit replaces the zero.
  await key(page, "9").click();
  await expect(display(page)).toHaveText("9");
});

test("AC-014: backspace twice on 4.5 shows 4", async ({ page }) => {
  await key(page, "4").click();
  await key(page, "Decimal point").click();
  await key(page, "5").click();
  await expect(display(page)).toHaveText("4.5");

  await key(page, "Backspace").click();
  await key(page, "Backspace").click();
  await expect(display(page)).toHaveText("4");
});

test("AC-015: backspace on a completed result edits it as a new entry without crashing", async ({ page }) => {
  await key(page, "1").click();
  await key(page, "0").click();
  await key(page, "Add").click();
  await key(page, "1").click();
  await key(page, "0").click();
  await key(page, "Equals").click();
  await expect(display(page)).toHaveText("20");

  await key(page, "Backspace").click();
  await expect(display(page)).toHaveText("2");

  // The shown result is now a fresh entry: typing appends.
  await key(page, "5").click();
  await expect(display(page)).toHaveText("25");
});
