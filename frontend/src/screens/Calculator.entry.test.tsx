import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(() => cleanup());

// The display is the live region that mirrors exactly what the user sees.
function displayText() {
  return screen.getByRole("status").textContent;
}

// Click an on-screen key the way a visitor with a mouse would.
function clickKey(name: string) {
  fireEvent.click(screen.getByRole("button", { name }));
}

describe("Calculator — entering numbers with digits and a decimal point (US-003)", () => {
  it("AC-008: from 0 with no entry, pressing 5 then 2 shows 52 with no leading zero", () => {
    render(<Calculator />);
    expect(displayText()).toBe("0");

    clickKey("5");
    expect(displayText()).toBe("5");

    clickKey("2");
    // The initial zero was replaced, not prefixed.
    expect(displayText()).toBe("52");
  });

  it("AC-009: with 12 shown, decimal point then 5 shows 12.5", () => {
    render(<Calculator />);

    clickKey("1");
    clickKey("2");
    expect(displayText()).toBe("12");

    clickKey("Decimal point");
    clickKey("5");
    expect(displayText()).toBe("12.5");
  });

  it("AC-010: with 12.5 shown, a second decimal point leaves 12.5 unchanged", () => {
    render(<Calculator />);

    clickKey("1");
    clickKey("2");
    clickKey("Decimal point");
    clickKey("5");
    expect(displayText()).toBe("12.5");

    // A number may contain at most one decimal point.
    clickKey("Decimal point");
    expect(displayText()).toBe("12.5");
  });

  it("AC-011: from 0 with no entry, pressing the decimal point first shows 0.", () => {
    render(<Calculator />);
    expect(displayText()).toBe("0");

    clickKey("Decimal point");
    expect(displayText()).toBe("0.");

    // And a fraction such as 0.75 can then be completed.
    clickKey("7");
    clickKey("5");
    expect(displayText()).toBe("0.75");
  });
});
