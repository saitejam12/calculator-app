import { test, expect } from "@playwright/test";

// US-001 — See a result display on the calculator page.
// Each test is named after the acceptance criterion it proves and drives the
// page the way a visitor would.
test.beforeEach(async ({ page }) => {
  await page.goto("/calculator");
});

test("AC-001: on first load a single result display shows 0 and no other value", async ({
  page,
}) => {
  const displays = page.getByRole("status");
  await expect(displays).toHaveCount(1);
  await expect(displays.first()).toHaveText("0");
});

test("AC-002: pressing digit keys shows exactly the number entered so far", async ({
  page,
}) => {
  const display = page.getByRole("status");

  await page.getByRole("button", { name: "1", exact: true }).click();
  await expect(display).toHaveText("1");

  await page.getByRole("button", { name: "2", exact: true }).click();
  await expect(display).toHaveText("12");

  await page.getByRole("button", { name: "3", exact: true }).click();
  await expect(display).toHaveText("123");
});

test("AC-003: after a completed calculation only the current result is shown", async ({
  page,
}) => {
  const display = page.getByRole("status");

  await page.getByRole("button", { name: "6", exact: true }).click();
  await page.getByRole("button", { name: "Multiply" }).click();
  await page.getByRole("button", { name: "7", exact: true }).click();
  await page.getByRole("button", { name: "Equals" }).click();

  // A single display, showing just the result — no history or secondary line.
  await expect(page.getByRole("status")).toHaveCount(1);
  await expect(display).toHaveText("42");
});

test("AC-004: an over-long value stays inside the display without breaking layout", async ({
  page,
}) => {
  const display = page.getByRole("status");

  for (const d of ["2", "3", "4", "5", "6", "7", "8", "9", "1", "2", "3", "4"]) {
    await page.getByRole("button", { name: d, exact: true }).click();
  }
  await expect(display).toHaveText("234567891234");

  // The rendered text must not be wider than the display window that clips it,
  // so it never overflows the page or the button grid.
  const windowHandle = await display.evaluateHandle(
    (el) => el.parentElement as HTMLElement
  );
  const displayBox = await display.boundingBox();
  const windowBox = await (windowHandle.asElement() as any).boundingBox();

  expect(displayBox).not.toBeNull();
  expect(windowBox).not.toBeNull();
  // The display text fits within the display window's width.
  expect(displayBox!.width).toBeLessThanOrEqual(windowBox!.width + 1);
});
