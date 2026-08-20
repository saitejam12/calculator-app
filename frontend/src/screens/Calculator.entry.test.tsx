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

describe("Calculator — number entry with digits and a decimal point (US-003)", () => {
  it("AC-008: pressing 5 then 2 shows 52 with no leading zero remaining", () => {
    render(<Calculator />);
    expect(displayText()).toBe("0");
    click("5");
    click("2");
    expect(displayText()).toBe("52");
  });

  it("AC-009: from 12, pressing decimal then 5 shows 12.5", () => {
    render(<Calculator />);
    click("1");
    click("2");
    expect(displayText()).toBe("12");
    click("Decimal point");
    click("5");
    expect(displayText()).toBe("12.5");
  });

  it("AC-010: a second decimal point leaves 12.5 unchanged", () => {
    render(<Calculator />);
    click("1");
    click("2");
    click("Decimal point");
    click("5");
    expect(displayText()).toBe("12.5");
    click("Decimal point");
    expect(displayText()).toBe("12.5");
  });

  it("AC-011: pressing the decimal point first shows 0. and allows 0.75", () => {
    render(<Calculator />);
    click("Decimal point");
    expect(displayText()).toBe("0.");
    click("7");
    click("5");
    expect(displayText()).toBe("0.75");
  });
});
