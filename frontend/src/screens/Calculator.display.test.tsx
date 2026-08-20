import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(cleanup);

// The display is the aria-live status region; its text is exactly the shown value.
function display(): HTMLElement {
  return screen.getByRole("status");
}

function displayText(): string {
  return display().textContent ?? "";
}

function type(...keys: string[]): void {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
  }
}

// The display font-size is expressed in rem; read the numeric size the value renders at.
function fontRem(el: HTMLElement): number {
  return parseFloat(el.style.fontSize);
}

describe("Calculator — result display (US-001)", () => {
  it("AC-001: on first load a single result display is visible showing 0 and no other value", () => {
    render(<Calculator />);
    const statuses = screen.getAllByRole("status");
    expect(statuses).toHaveLength(1);
    expect(displayText()).toBe("0");
  });

  it("AC-002: pressing digit keys updates the display to exactly the number entered so far", () => {
    render(<Calculator />);
    type("4");
    expect(displayText()).toBe("4");
    type("2");
    expect(displayText()).toBe("42");
    type("0");
    expect(displayText()).toBe("420");
  });

  it("AC-002: clicking digit buttons shows exactly the number entered, with no leading zero", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "9" }));
    expect(displayText()).toBe("789");
  });

  it("AC-003: after a completed calculation the display shows only the current value (the result)", () => {
    render(<Calculator />);
    type("2", "+", "3", "=");
    expect(displayText()).toBe("5");
    // A single display region: no history panel and no secondary value line in this version.
    expect(screen.getAllByRole("status")).toHaveLength(1);
  });

  it("AC-004: a value too long to fit is shrunk so it stays readable rather than overflowing", () => {
    render(<Calculator />);
    type("5");
    expect(displayText()).toBe("5");
    const shortSize = fontRem(display());

    type("Escape");
    // Enter the maximum-length number the calculator accepts.
    type("1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "1", "2");
    expect(displayText()).toBe("123456789012");
    const longSize = fontRem(display());

    // The long value renders at a smaller font size than a short one, keeping it within the display.
    expect(longSize).toBeLessThan(shortSize);
    expect(longSize).toBeGreaterThan(0);
  });
});
