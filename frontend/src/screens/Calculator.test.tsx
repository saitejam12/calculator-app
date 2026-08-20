import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(() => cleanup());

// The display is the live region that mirrors exactly what the user sees.
function displayText() {
  return screen.getByRole("status").textContent;
}

// A physical key press while the page (body) is focused.
function typeKey(key: string) {
  fireEvent.keyDown(document.body, { key });
}

describe("Calculator — physical keyboard operation (US-005)", () => {
  it("AC-016: number and decimal keys enter digits like the matching buttons", () => {
    render(<Calculator />);
    expect(displayText()).toBe("0");

    typeKey("5");
    typeKey(".");
    typeKey("5");

    expect(displayText()).toBe("5.5");
  });

  it("AC-017: +, -, * and / apply the matching operations", () => {
    render(<Calculator />);

    // 6 * 7 = 42
    typeKey("6");
    typeKey("*");
    typeKey("7");
    typeKey("Enter");
    expect(displayText()).toBe("42");

    // Reset and try subtraction: 9 - 4 = 5
    typeKey("Escape");
    typeKey("9");
    typeKey("-");
    typeKey("4");
    typeKey("=");
    expect(displayText()).toBe("5");

    // Division: 8 / 2 = 4
    typeKey("Escape");
    typeKey("8");
    typeKey("/");
    typeKey("2");
    typeKey("=");
    expect(displayText()).toBe("4");
  });

  it("AC-018: Enter (and =) completes a pending operation like equals", () => {
    render(<Calculator />);

    typeKey("8");
    typeKey("+");
    typeKey("2");
    typeKey("Enter");
    expect(displayText()).toBe("10");

    typeKey("Escape");
    typeKey("3");
    typeKey("+");
    typeKey("4");
    typeKey("=");
    expect(displayText()).toBe("7");
  });

  it("AC-019: Backspace deletes the last character", () => {
    render(<Calculator />);

    typeKey("1");
    typeKey("2");
    typeKey("3");
    expect(displayText()).toBe("123");

    typeKey("Backspace");
    expect(displayText()).toBe("12");

    typeKey("Backspace");
    typeKey("Backspace");
    expect(displayText()).toBe("0");
  });

  it("AC-020: Escape resets the calculator like Clear", () => {
    render(<Calculator />);

    typeKey("7");
    typeKey("*");
    typeKey("3");
    expect(displayText()).toBe("3");

    typeKey("Escape");
    expect(displayText()).toBe("0");

    // After reset a fresh sum works from scratch.
    typeKey("9");
    expect(displayText()).toBe("9");
  });

  it("AC-021: a key with no calculator meaning leaves state unchanged and does not throw", () => {
    render(<Calculator />);

    typeKey("5");
    expect(displayText()).toBe("5");

    expect(() => {
      typeKey("a");
      typeKey("Z");
      typeKey("F1");
      typeKey("ArrowLeft");
    }).not.toThrow();

    // The display is exactly as it was before the meaningless keys.
    expect(displayText()).toBe("5");
  });

  it("AC-022: buttons are focusable and their action applies when activated", () => {
    render(<Calculator />);

    const five = screen.getByRole("button", { name: "5" });
    const add = screen.getByRole("button", { name: "Add" });
    const equals = screen.getByRole("button", { name: "Equals" });

    // Tabbing lands on a native button that can hold focus.
    add.focus();
    expect(document.activeElement).toBe(add);

    // Activating buttons (what Enter/Space do on a focused native button)
    // performs the calculation using the keyboard alone: 5 + 5 = 10.
    fireEvent.click(five);
    fireEvent.click(add);
    fireEvent.click(five);
    fireEvent.click(equals);
    expect(displayText()).toBe("10");
  });

  it("AC-022: focusing a button does not stop typed digit keys from registering", () => {
    render(<Calculator />);

    const clear = screen.getByRole("button", { name: "Clear" });
    clear.focus();

    // A digit key with a button focused still enters the digit.
    fireEvent.keyDown(clear, { key: "7" });
    expect(displayText()).toBe("7");
  });
});
