import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(cleanup);

// The display is the aria-live status region; its text is exactly the shown value.
function displayText(): string {
  return screen.getByRole("status").textContent ?? "";
}

function click(name: string): void {
  fireEvent.click(screen.getByRole("button", { name }));
}

// US-004 — Delete the last digit with backspace, exercised through the on-screen
// ⌫ key (aria-label "Backspace") the way a visitor operates the calculator.
describe("Calculator — backspace deletes the last character (US-004)", () => {
  it("AC-012: backspace on 123 shows 12 and leaves the rest of the calculation unchanged", () => {
    render(<Calculator />);
    // Establish a pending operation so we can prove acc/op survive the edit.
    click("5");
    click("Add");
    click("1");
    click("2");
    click("3");
    expect(displayText()).toBe("123");

    click("Backspace");
    expect(displayText()).toBe("12");

    // The pending 5 + is still in effect: completing gives 5 + 12 = 17.
    click("Equals");
    expect(displayText()).toBe("17");
  });

  it("AC-013: backspace on a single digit 7 shows 0 and treats the entry as empty", () => {
    render(<Calculator />);
    click("7");
    expect(displayText()).toBe("7");

    click("Backspace");
    expect(displayText()).toBe("0");

    // Empty entry: the next digit replaces the zero rather than appending to it.
    click("9");
    expect(displayText()).toBe("9");
  });

  it("AC-014: backspace twice on 4.5 shows 4", () => {
    render(<Calculator />);
    click("4");
    click("Decimal point");
    click("5");
    expect(displayText()).toBe("4.5");

    click("Backspace");
    expect(displayText()).toBe("4.");
    click("Backspace");
    expect(displayText()).toBe("4");
  });

  it("AC-015: backspace on a completed result edits the shown result as a new entry", () => {
    render(<Calculator />);
    // Produce a completed multi-digit result: 10 + 10 = 20.
    click("1");
    click("0");
    click("Add");
    click("1");
    click("0");
    click("Equals");
    expect(displayText()).toBe("20");

    // Backspace must not crash and must edit the shown result predictably.
    expect(() => click("Backspace")).not.toThrow();
    expect(displayText()).toBe("2");

    // The trimmed result is now a fresh entry: typing appends to it.
    click("5");
    expect(displayText()).toBe("25");
  });
});
