import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(() => cleanup());

// The result display is the single live region the visitor reads.
function display() {
  return screen.getByRole("status");
}

function displayText() {
  return display().textContent;
}

function clickKey(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("Calculator — result display (US-001)", () => {
  it("AC-001: on first load a single result display shows 0 and nothing else", () => {
    render(<Calculator />);

    // Exactly one result display exists...
    const displays = screen.getAllByRole("status");
    expect(displays).toHaveLength(1);

    // ...and it reads 0, with no other value alongside it.
    expect(displayText()).toBe("0");
    expect(display().textContent).not.toMatch(/[1-9]/);
  });

  it("AC-002: pressing digit keys shows exactly the number entered so far", () => {
    render(<Calculator />);

    clickKey("1");
    expect(displayText()).toBe("1");

    clickKey("2");
    expect(displayText()).toBe("12");

    clickKey("3");
    clickKey("4");
    clickKey("5");
    expect(displayText()).toBe("12345");
  });

  it("AC-002: a leading digit replaces the initial 0 rather than appending to it", () => {
    render(<Calculator />);

    expect(displayText()).toBe("0");
    clickKey("7");
    // Not "07": the display shows exactly what was entered.
    expect(displayText()).toBe("7");
  });

  it("AC-003: after a completed calculation only the current result is shown", () => {
    render(<Calculator />);

    // 6 x 7 = 42
    clickKey("6");
    clickKey("Multiply");
    clickKey("7");
    clickKey("Equals");

    // Still one and only one display region.
    expect(screen.getAllByRole("status")).toHaveLength(1);

    // It shows the result and nothing else — no operands, no operator,
    // no history/secondary line survives the equals.
    expect(displayText()).toBe("42");
    expect(displayText()).not.toContain("6");
    expect(displayText()).not.toContain("7");
    expect(displayText()).not.toContain("×");
  });

  it("AC-004: an over-long value shrinks its text and stays inside a clipped display area", () => {
    render(<Calculator />);

    // Baseline: a short value uses the largest type size.
    clickKey("1");
    const shortSize = display().style.fontSize;
    expect(shortSize).toBe("3.25rem");

    // Fill the display with a long number.
    clickKey("C");
    ["2", "3", "4", "5", "6", "7", "8", "9", "1", "2", "3", "4"].forEach(clickKey);
    expect(displayText()).toBe("234567891234");

    // The long value is rendered at a smaller size than the short one so it
    // remains readable within the fixed display width.
    const longSize = display().style.fontSize;
    expect(longSize).not.toBe(shortSize);
    expect(parseFloat(longSize)).toBeLessThan(parseFloat(shortSize));

    // The text is truncated and the window clips overflow, so it cannot
    // spill out of the display box and break the button grid below.
    expect(display().className).toContain("truncate");
    const windowBox = display().parentElement as HTMLElement;
    expect(windowBox.className).toContain("overflow-hidden");
  });
});
