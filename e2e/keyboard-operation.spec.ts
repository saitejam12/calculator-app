import { test, expect, Page } from "@playwright/test";

// US-005 — Operate the calculator from the physical keyboard.
// Each spec is named after the acceptance criterion it proves and drives the
// page the way a desktop visitor would: real key events, real focus, the value
// read back from the display live region (role="status").

function display(page: Page) {
  return page.getByRole("status");
}

test.beforeEach(async ({ page }) => {
  // The calculator is the app screen at the 'calculator' route. It runs
  // entirely in the browser; no API call backs the keypresses.
  await page.goto("/calculator");
  await expect(display(page)).toHaveText("0");
  // Make sure keystrokes land on the document, not the address bar.
  await page.locator("body").click({ position: { x: 2, y: 2 } });
});

test("AC-016: number and decimal-point keys enter digits like the buttons", async ({ page }) => {
  await page.keyboard.type("5");
  await page.keyboard.type(".");
  await page.keyboard.type("5");
  await expect(display(page)).toHaveText("5.5");
});

test("AC-017: +, -, * and / apply the matching operations", async ({ page }) => {
  // 6 * 7 = 42
  await page.keyboard.type("6");
  await page.keyboard.type("*");
  await page.keyboard.type("7");
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("42");

  // 9 - 4 = 5
  await page.keyboard.press("Escape");
  await page.keyboard.type("9");
  await page.keyboard.type("-");
  await page.keyboard.type("4");
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("5");

  // 8 / 2 = 4
  await page.keyboard.press("Escape");
  await page.keyboard.type("8");
  await page.keyboard.type("/");
  await page.keyboard.type("2");
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("4");
});

test("AC-018: Enter and = complete a pending operation like equals", async ({ page }) => {
  await page.keyboard.type("8");
  await page.keyboard.type("+");
  await page.keyboard.type("2");
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("10");

  await page.keyboard.press("Escape");
  await page.keyboard.type("3");
  await page.keyboard.type("+");
  await page.keyboard.type("4");
  await page.keyboard.type("=");
  await expect(display(page)).toHaveText("7");
});

test("AC-019: Backspace deletes the last character", async ({ page }) => {
  await page.keyboard.type("123");
  await expect(display(page)).toHaveText("123");

  await page.keyboard.press("Backspace");
  await expect(display(page)).toHaveText("12");

  await page.keyboard.press("Backspace");
  await page.keyboard.press("Backspace");
  await expect(display(page)).toHaveText("0");
});

test("AC-020: Escape resets the calculator like Clear", async ({ page }) => {
  await page.keyboard.type("7");
  await page.keyboard.type("*");
  await page.keyboard.type("3");
  await expect(display(page)).toHaveText("3");

  await page.keyboard.press("Escape");
  await expect(display(page)).toHaveText("0");

  // A fresh entry works from scratch after the reset.
  await page.keyboard.type("9");
  await expect(display(page)).toHaveText("9");
});

test("AC-021: a key with no calculator meaning leaves the display unchanged and does not error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(String(e)));

  await page.keyboard.type("5");
  await expect(display(page)).toHaveText("5");

  await page.keyboard.type("aZ");
  await page.keyboard.press("F1");
  await page.keyboard.press("ArrowLeft");

  await expect(display(page)).toHaveText("5");
  expect(errors).toEqual([]);
});

test("AC-022: Tab reaches the key grid and a focused button activates with Enter or Space", async ({ page }) => {
  // Tab from the page lands on a real, focusable grid button.
  await page.keyboard.press("Tab");
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName);
  expect(focusedTag).toBe("BUTTON");

  // Operate the calculator by keyboard alone: focus each button and fire its
  // native activation with Enter or Space. 5 + 5 = 10.
  await page.getByRole("button", { name: "5" }).focus();
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("5");

  await page.getByRole("button", { name: "Add" }).focus();
  await page.keyboard.press("Space");

  await page.getByRole("button", { name: "5" }).focus();
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("5");

  await page.getByRole("button", { name: "Equals" }).focus();
  await page.keyboard.press("Enter");
  await expect(display(page)).toHaveText("10");
});
