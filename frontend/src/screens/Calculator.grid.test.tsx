import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(cleanup);

// The display is the aria-live status region; its text is exactly the shown value.
function displayText(): string {
  return screen.getByRole("status").textContent ?? "";
}

// Every button the grid is required to expose, by accessible name.
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

const OPERATOR_NAMES = ["Add", "Subtract", "Multiply", "Divide"];
const DIGIT_NAMES = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];

describe("Calculator — on-screen button grid (US-002)", () => {
  it("AC-005: exposes buttons for every digit, the decimal point and every operation", () => {
    render(<Calculator />);
    for (const name of EXPECTED_BUTTON_NAMES) {
      expect(
        screen.getByRole("button", { name }),
        `expected a button named "${name}"`,
      ).toBeTruthy();
    }
  });

  it("AC-005: shows those buttons and no other function buttons", () => {
    render(<Calculator />);
    const actual = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label") ?? b.textContent ?? "")
      .sort();
    expect(actual).toEqual([...EXPECTED_BUTTON_NAMES].sort());
  });

  it("AC-006: activating a button gives a visible pressed state", () => {
    render(<Calculator />);
    const five = screen.getByRole("button", { name: "5" });
    // Before pressing, the key is at rest (no downward press offset).
    expect(five.style.transform).toBe("translateY(0)");
    fireEvent.click(five);
    // A press pushes the key down — a state a sighted user can see.
    expect(five.style.transform).toBe("translateY(3px)");
  });

  it("AC-006: a single click applies the action exactly once", () => {
    render(<Calculator />);
    // If a click were handled twice, two digits would land: "11" not "1".
    fireEvent.click(screen.getByRole("button", { name: "1" }));
    expect(displayText()).toBe("1");
    fireEvent.click(screen.getByRole("button", { name: "2" }));
    expect(displayText()).toBe("12");
  });

  it("AC-006: clicking through a full sum applies each button once", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "7" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "8" }));
    fireEvent.click(screen.getByRole("button", { name: "Equals" }));
    expect(displayText()).toBe("15");
  });

  it("AC-007: operator buttons are visually distinct from digit buttons", () => {
    render(<Calculator />);
    const digit = screen.getByRole("button", { name: "5" });
    const digitColor = digit.style.color;
    const digitBg = digit.style.backgroundColor;

    for (const name of OPERATOR_NAMES) {
      const op = screen.getByRole("button", { name });
      // At-a-glance distinction: operators must not read the same as digits.
      const differsInColour =
        op.style.color !== digitColor || op.style.backgroundColor !== digitBg;
      expect(differsInColour, `${name} should look different from a digit`).toBe(true);
    }
  });

  it("AC-007: all four operators share one look, distinct from the digits' look", () => {
    render(<Calculator />);
    const digit = screen.getByRole("button", { name: "1" });

    const opColors = OPERATOR_NAMES.map(
      (name) => screen.getByRole("button", { name }).style.color,
    );
    // Operators are consistent with each other...
    expect(new Set(opColors).size).toBe(1);
    // ...and that shared colour is not the digit colour.
    expect(opColors[0]).not.toBe(digit.style.color);

    const digitColors = DIGIT_NAMES.map(
      (name) => screen.getByRole("button", { name }).style.color,
    );
    // Digits are consistent with each other.
    expect(new Set(digitColors).size).toBe(1);
  });
});
