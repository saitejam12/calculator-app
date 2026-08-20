import { test, expect, Page } from "@playwright/test";

// US-005 — Operate the calculator from the physical keyboard.
//
// These specs drive the calculator the way a desktop visitor would: through the
// real browser keyboard and through Tab focus of the button grid. The display is
// the aria-live status region whose text is exactly the shown value.
//
// The Calculator screen is a client-only React screen (SCR-001) at route
// 'calculator'. No backend/JWT is exercised: every sum is worked out in the
// browser. If the app mounts the route under a different base path, adjust
// ROUTE below.
const ROUTE = "/calculator";

async function gotoCalculator(page: Page): Promise<void> {
  await page.goto(ROUTE);
  // Ensure the page (not any element) is the keyboard target, matching a visitor
  // who has clicked onto the calculator area but no specific button.
  await expect(page.getByRole("heading", { name: "Desk Machine" })).toBeVisible();
  await page.locator("body").click();
}

function display(page: Page) {
  return page.getByRole("status");
}

async function typeKeys(page: Page, keys: string[]): Promise<void> {
  for (const key of keys) {
    await page.keyboard.press(key);
  }
}

test.describe("US-005 — physical keyboard operation", () => {
  test("AC-016: pressing 0-9 and the decimal key enters digits and a decimal point", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["1", "2", ".", "5"]);
    await expect(display(page)).toHaveText("12.5");
  });

  test("AC-017: pressing + applies addition like the Add button", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["5", "+", "3", "="]);
    await expect(display(page)).toHaveText("8");
  });

  test("AC-017: pressing - applies subtraction", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["9", "-", "4", "="]);
    await expect(display(page)).toHaveText("5");
  });

  test("AC-017: pressing * applies multiplication", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["4", "*", "2", "="]);
    await expect(display(page)).toHaveText("8");
  });

  test("AC-017: pressing / applies division", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["8", "/", "2", "="]);
    await expect(display(page)).toHaveText("4");
  });

  test("AC-018: pressing Enter completes a pending operation like equals", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["7", "+", "3", "Enter"]);
    await expect(display(page)).toHaveText("10");
  });

  test("AC-018: pressing = also completes a pending operation", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["6", "*", "6", "="]);
    await expect(display(page)).toHaveText("36");
  });

  test("AC-019: pressing Backspace deletes the last character entered", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["1", "2", "3"]);
    await expect(display(page)).toHaveText("123");
    await page.keyboard.press("Backspace");
    await expect(display(page)).toHaveText("12");
  });

  test("AC-020: pressing Escape resets the calculator from any state", async ({ page }) => {
    await gotoCalculator(page);
    await typeKeys(page, ["9", "*", "9", "="]);
    await expect(display(page)).toHaveText("81");
    await page.keyboard.press("Escape");
    await expect(display(page)).toHaveText("0");
  });

  test("AC-021: a key with no calculator meaning leaves the display unchanged and does not error", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(String(err)));
    await gotoCalculator(page);
    await page.keyboard.press("5");
    await expect(display(page)).toHaveText("5");
    // Letters and other non-calculator keys.
    await typeKeys(page, ["a", "Z", "q", "ArrowLeft", "F1"]);
    await expect(display(page)).toHaveText("5");
    expect(errors).toEqual([]);
  });

  test("AC-022: the button grid is reachable by Tab and a focused button is activated by Space", async ({ page }) => {
    await gotoCalculator(page);

    // Tab from the page moves focus into the interactive grid; keep tabbing until
    // a real BUTTON holds focus, proving the grid is keyboard-reachable.
    let onButton = false;
    for (let i = 0; i < 30 && !onButton; i++) {
      await page.keyboard.press("Tab");
      onButton = await page.evaluate(() => document.activeElement?.tagName === "BUTTON");
    }
    expect(onButton).toBe(true);

    // Focus a specific button and activate it with the native keyboard, no mouse.
    await page.getByRole("button", { name: "5" }).focus();
    await page.keyboard.press("Space");
    await expect(display(page)).toHaveText("5");

    await page.getByRole("button", { name: "Add" }).focus();
    await page.keyboard.press("Enter");
    // Add is applied but the running value is still shown; entering resets.
    await expect(display(page)).toHaveText("5");

    await page.getByRole("button", { name: "3" }).focus();
    await page.keyboard.press("Enter");
    await expect(display(page)).toHaveText("3");

    // Equals via native button activation completes the sum exactly once.
    await page.getByRole("button", { name: "Equals" }).focus();
    await page.keyboard.press("Enter");
    await expect(display(page)).toHaveText("8");
  });
});
