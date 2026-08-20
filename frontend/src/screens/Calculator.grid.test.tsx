import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(() => cleanup());

// The display is the live region that mirrors exactly what the user sees.
function displayText() {
  return screen.getByRole("status").textContent;
}

// The full set of controls the grid must offer, addressed by the accessible
// name a screen-reader user (and the test) sees — digits carry their own
// label, functions carry a descriptive one.
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

describe("Calculator — on-screen button grid (US-002)", () => {
  it("AC-005: the grid has exactly the required buttons and no other function buttons", () => {
    render(<Calculator />);

    const labels = screen
      .getAllByRole("button")
      .map((b) => b.getAttribute("aria-label"));

    // Every digit, the decimal point, all four operators, equals, clear,
    // percent, sign flip and backspace are present...
    for (const label of EXPECTED_LABELS) {
      expect(labels).toContain(label);
    }

    // ...and nothing beyond that list exists — no memory keys, no extra
    // functions. Sorting both sides makes the comparison order-independent.
    expect([...labels].sort()).toEqual([...EXPECTED_LABELS].sort());
  });

  it("AC-006: clicking a button gives a visible pressed state", () => {
    render(<Calculator />);

    const seven = screen.getByRole("button", { name: "7" });

    // At rest the key sits flush.
    expect(seven.style.transform).toBe("translateY(0)");

    fireEvent.click(seven);

    // On press it depresses — a state the user can see.
    expect(seven.style.transform).toBe("translateY(3px)");

    // And only the pressed key reacts, not its neighbours.
    const eight = screen.getByRole("button", { name: "8" });
    expect(eight.style.transform).toBe("translateY(0)");
  });

  it("AC-006: a single click applies its action exactly once", () => {
    render(<Calculator />);

    // One click on '5' enters a single digit, not two.
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    expect(displayText()).toBe("5");

    // A whole click-driven calculation applies each key once: 5 + 4 = 9.
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "4" }));
    fireEvent.click(screen.getByRole("button", { name: "Equals" }));
    expect(displayText()).toBe("9");
  });

  it("AC-007: operator buttons are visually distinguishable from digit buttons", () => {
    render(<Calculator />);

    const digit = screen.getByRole("button", { name: "7" });
    const add = screen.getByRole("button", { name: "Add" });
    const divide = screen.getByRole("button", { name: "Divide" });

    // Operators differ from digits in fill and text colour, so the grid
    // reads at a glance.
    expect(add.style.backgroundColor).not.toBe(digit.style.backgroundColor);
    expect(add.style.color).not.toBe(digit.style.color);

    // And every operator shares that distinct operator treatment.
    expect(divide.style.backgroundColor).toBe(add.style.backgroundColor);
    expect(divide.style.color).toBe(add.style.color);
  });
});
