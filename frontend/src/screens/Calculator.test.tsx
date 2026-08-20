import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";

import Calculator from "./Calculator";

afterEach(cleanup);

// The display is the aria-live status region; its text is exactly the shown value.
function displayText(): string {
  return screen.getByRole("status").textContent ?? "";
}

function type(...keys: string[]): void {
  for (const key of keys) {
    fireEvent.keyDown(window, { key });
  }
}

describe("Calculator — physical keyboard operation (US-005)", () => {
  it("AC-016: pressing 0-9 and the decimal key enters digits and a decimal point", () => {
    render(<Calculator />);
    type("1", "2", ".", "5");
    expect(displayText()).toBe("12.5");
  });

  it("AC-017: pressing + applies addition just like the Add button", () => {
    render(<Calculator />);
    type("5", "+", "3", "=");
    expect(displayText()).toBe("8");
  });

  it("AC-017: pressing - applies subtraction", () => {
    render(<Calculator />);
    type("9", "-", "4", "=");
    expect(displayText()).toBe("5");
  });

  it("AC-017: pressing * applies multiplication", () => {
    render(<Calculator />);
    type("4", "*", "2", "=");
    expect(displayText()).toBe("8");
  });

  it("AC-017: pressing / applies division", () => {
    render(<Calculator />);
    type("8", "/", "2", "=");
    expect(displayText()).toBe("4");
  });

  it("AC-018: pressing Enter completes a pending operation like equals", () => {
    render(<Calculator />);
    type("7", "+", "3", "Enter");
    expect(displayText()).toBe("10");
  });

  it("AC-018: pressing = also completes a pending operation", () => {
    render(<Calculator />);
    type("6", "*", "6", "=");
    expect(displayText()).toBe("36");
  });

  it("AC-019: pressing Backspace deletes the last character entered", () => {
    render(<Calculator />);
    type("1", "2", "3");
    expect(displayText()).toBe("123");
    type("Backspace");
    expect(displayText()).toBe("12");
  });

  it("AC-020: pressing Escape resets the calculator from any state", () => {
    render(<Calculator />);
    type("9", "*", "9", "=");
    expect(displayText()).toBe("81");
    type("Escape");
    expect(displayText()).toBe("0");
  });

  it("AC-021: keys with no calculator meaning leave the display unchanged and do not error", () => {
    render(<Calculator />);
    type("5");
    expect(displayText()).toBe("5");
    expect(() => type("a", "Z", "q", "Tab", "ArrowLeft", "F1")).not.toThrow();
    expect(displayText()).toBe("5");
  });

  it("AC-022: the button grid is operable — activating buttons applies their action", () => {
    render(<Calculator />);
    // Buttons are real, accessible buttons reachable by Tab and activated by Enter/Space.
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    fireEvent.click(screen.getByRole("button", { name: "Equals" }));
    expect(displayText()).toBe("8");
  });

  it("AC-022: Enter on a focused button does not double-fire equals via the window handler", () => {
    render(<Calculator />);
    fireEvent.click(screen.getByRole("button", { name: "5" }));
    fireEvent.click(screen.getByRole("button", { name: "Add" }));
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(displayText()).toBe("3");

    const addButton = screen.getByRole("button", { name: "Add" });
    addButton.focus();
    // Bubbles to the window keydown listener with a BUTTON target: the handler must
    // yield to native button activation and NOT also apply Enter -> equals.
    fireEvent.keyDown(addButton, { key: "Enter" });
    expect(displayText()).toBe("3");
  });
});
