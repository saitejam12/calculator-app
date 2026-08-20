import React from "react";

import * as UI from "@/lib/ui";
import { Icons } from "@/lib/icons";
import { brand } from "@/lib/brand";

const { X } = Icons;

const INITIAL = { display: "0", acc: null, op: null, entering: false, error: false };

const ERROR_STATE = { display: "Error", acc: null, op: null, entering: false, error: true };

const MAX_DIGITS = 12;

const KEYS = [
  { id: "C", label: "C", kind: "clear", aria: "Clear" },
  { id: "±", label: "+/−", kind: "util", aria: "Flip sign" },
  { id: "%", label: "%", kind: "util", aria: "Percent" },
  { id: "÷", label: "÷", kind: "op", aria: "Divide" },

  { id: "7", label: "7", kind: "digit" },
  { id: "8", label: "8", kind: "digit" },
  { id: "9", label: "9", kind: "digit" },
  { id: "×", label: "×", kind: "op", aria: "Multiply" },

  { id: "4", label: "4", kind: "digit" },
  { id: "5", label: "5", kind: "digit" },
  { id: "6", label: "6", kind: "digit" },
  { id: "−", label: "−", kind: "op", aria: "Subtract" },

  { id: "1", label: "1", kind: "digit" },
  { id: "2", label: "2", kind: "digit" },
  { id: "3", label: "3", kind: "digit" },
  { id: "+", label: "+", kind: "op", aria: "Add" },

  { id: "0", label: "0", kind: "digit" },
  { id: ".", label: ".", kind: "digit", aria: "Decimal point" },
  { id: "⌫", label: "⌫", kind: "util", aria: "Backspace" },
  { id: "=", label: "=", kind: "eq", aria: "Equals" },
];

const KEY_STYLES = {
  digit: { backgroundColor: "#FCFAF4", color: "#2A2620", boxShadow: "0 3px 0 #CEC5B1" },
  util: { backgroundColor: "#DCD4C2", color: "#494334", boxShadow: "0 3px 0 #BCB29D" },
  op: { backgroundColor: "#F2E1D8", color: "#ab4726", boxShadow: "0 3px 0 #D8BCAE" },
  clear: { backgroundColor: "#DCD4C2", color: "#ab4726", boxShadow: "0 3px 0 #BCB29D" },
  eq: { backgroundColor: "#ab4726", color: "#FFF6F1", boxShadow: "0 3px 0 #7C3219" },
};

const NOTES = [
  {
    title: "Chained, like a pocket calculator",
    body:
      "Each operator you press finishes the sum so far. 2 + 3 × 4 gives 20, not 14 — the addition is settled the moment × is pressed. There is no operator precedence and no parentheses.",
  },
  {
    title: "How percent behaves",
    body:
      "With + or −, percent is a share of the running total: 200 + 10 % = gives 220, and 200 − 10 % = gives 180. On its own, or with × and ÷, percent just divides the entry by a hundred: 50 % gives 0.5.",
  },
  {
    title: "Rounding and errors",
    body:
      "Results are rounded for display, so 0.1 + 0.2 shows 0.3. Very large or very small answers switch to exponential notation. Dividing by zero shows Error — press C to start again.",
  },
];

const SHORTCUTS = [
  { keys: "0 – 9  .", does: "Enter digits and the decimal point" },
  { keys: "+  −  *  /", does: "Add, subtract, multiply, divide" },
  { keys: "Enter  or  =", does: "Equals" },
  { keys: "Backspace", does: "Delete the last character" },
  { keys: "Escape", does: "Clear everything" },
];

function toNumber(s) {
  const n = parseFloat(s);
  return isFinite(n) ? n : 0;
}

function isBad(n) {
  return typeof n !== "number" || !isFinite(n) || isNaN(n);
}

function formatValue(n) {
  if (isBad(n)) return "Error";
  if (n === 0) return "0";
  const abs = Math.abs(n);
  if (abs >= 1e12 || abs < 1e-9) {
    let s = n.toExponential(6);
    let [m, e] = s.split("e");
    if (m.indexOf(".") !== -1) m = m.replace(/0+$/, "").replace(/\.$/, "");
    const sign = e[0] === "-" ? "-" : "+";
    const digits = e.replace(/^[+-]/, "");
    return m + "e" + sign + digits;
  }
  let s = String(parseFloat(n.toPrecision(10)));
  if (s.indexOf("e") !== -1) s = String(parseFloat(n.toPrecision(8)));
  return s;
}

function applyOp(a, b, op) {
  switch (op) {
    case "+": return a + b;
    case "−": return a - b;
    case "×": return a * b;
    case "÷": return b === 0 ? NaN : a / b;
    default: return b;
  }
}

function countDigits(s) {
  return (s.match(/[0-9]/g) || []).length;
}

function reduce(st, key) {
  if (key === "C") return { ...INITIAL };
  if (st.error) return st;

  if (key >= "0" && key <= "9") {
    if (!st.entering) return { ...st, display: key, entering: true };
    if (countDigits(st.display) >= MAX_DIGITS) return st;
    if (st.display === "0") return { ...st, display: key };
    if (st.display === "-0") return { ...st, display: "-" + key };
    return { ...st, display: st.display + key };
  }

  if (key === ".") {
    if (!st.entering) return { ...st, display: "0.", entering: true };
    if (st.display.indexOf(".") !== -1) return st;
    return { ...st, display: st.display + "." };
  }

  if (key === "⌫") {
    const trimmed = st.display.slice(0, -1);
    if (trimmed === "" || trimmed === "-") return { ...st, display: "0", entering: false };
    return { ...st, display: trimmed, entering: true };
  }

  if (key === "±") {
    if (st.display === "0" || st.display === "0.") return st;
    const flipped = st.display.charAt(0) === "-" ? st.display.slice(1) : "-" + st.display;
    return { ...st, display: flipped };
  }

  if (key === "%") {
    const cur = toNumber(st.display);
    let v;
    if ((st.op === "+" || st.op === "−") && st.acc !== null) v = (st.acc * cur) / 100;
    else v = cur / 100;
    if (isBad(v)) return { ...ERROR_STATE };
    return { ...st, display: formatValue(v), entering: true };
  }

  if (key === "+" || key === "−" || key === "×" || key === "÷") {
    const cur = toNumber(st.display);
    if (st.op !== null && st.entering && st.acc !== null) {
      const r = applyOp(st.acc, cur, st.op);
      if (isBad(r)) return { ...ERROR_STATE };
      return { display: formatValue(r), acc: r, op: key, entering: false, error: false };
    }
    return { ...st, acc: cur, op: key, entering: false };
  }

  if (key === "=") {
    if (st.op === null || st.acc === null) return { ...st, entering: false };
    const r = applyOp(st.acc, toNumber(st.display), st.op);
    if (isBad(r)) return { ...ERROR_STATE };
    return { display: formatValue(r), acc: null, op: null, entering: false, error: false };
  }

  return st;
}

const KEYBOARD_MAP = {
  "+": "+", "-": "−", "*": "×", "x": "×", "X": "×", "/": "÷",
  "Enter": "=", "=": "=", "Backspace": "⌫", "Escape": "C", "%": "%",
  ".": ".", ",": ".",
};

export default function Screen() {
  const [st, setSt] = React.useState(INITIAL);
  const [flash, setFlash] = React.useState(null);

  const press = React.useCallback((key) => {
    setSt((prev) => reduce(prev, key));
    setFlash({ key });
  }, []);

  React.useEffect(() => {
    if (!flash) return undefined;
    const t = setTimeout(() => setFlash(null), 130);
    return () => clearTimeout(t);
  }, [flash]);

  React.useEffect(() => {
    const onKey = (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      let key = null;
      if (e.key >= "0" && e.key <= "9" && e.key.length === 1) key = e.key;
      else if (KEYBOARD_MAP[e.key]) key = KEYBOARD_MAP[e.key];
      if (!key) return;
      const tag = e.target && e.target.tagName;
      if (tag === "BUTTON" && (e.key === "Enter" || e.key === " ")) return;
      e.preventDefault();
      press(key);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [press]);

  const shown = st.display;
  const len = shown.length;
  const displaySize = len <= 8 ? "3.25rem" : len <= 11 ? "2.6rem" : len <= 14 ? "2.1rem" : "1.7rem";

  return (
    <div
      className="w-full flex justify-center px-4 py-10 sm:py-14"
      style={{ fontFamily: brand.fontBody, backgroundColor: brand.backgroundColor }}
    >
      <div className="w-full" style={{ maxWidth: "26rem" }}>
        <header className="mb-7">
          <h1
            className="text-3xl font-semibold tracking-tight"
            style={{ fontFamily: brand.fontHeading, color: "#2A2620" }}
          >
            Desk Machine
          </h1>
          <p className="mt-2 text-[15px] leading-relaxed" style={{ color: brand.neutralColor }}>
            A plain numeric calculator. Click the keys or type — nothing is saved, nothing is sent.
          </p>
        </header>

        {/* Calculator body */}
        <div
          className="p-5 sm:p-6"
          style={{
            backgroundColor: "#E3DCCB",
            borderRadius: "1.1rem",
            border: "1px solid #CFC6B2",
            boxShadow: "0 1px 0 #FAF6EC inset, 0 10px 24px -12px rgba(60,52,38,0.45)",
          }}
        >
          {/* Display window */}
          <div
            className="relative px-4 py-5 mb-5 overflow-hidden"
            style={{
              backgroundColor: "#C6D6A6",
              borderRadius: brand.radius,
              boxShadow: "0 2px 6px rgba(45,55,30,0.22) inset, 0 1px 0 #F3EFE3",
              border: "1px solid #A9BA88",
            }}
          >
            <span
              className="absolute left-4 top-3 text-sm font-semibold select-none"
              style={{ color: "rgba(42,52,28,0.42)" }}
              aria-hidden="true"
            >
              {st.error ? "!" : st.op || ""}
            </span>
            <div
              className="text-right font-semibold tabular-nums truncate"
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: displaySize,
                lineHeight: 1.15,
                color: st.error ? "#7C3219" : "#22301A",
                letterSpacing: "-0.01em",
              }}
              role="status"
              aria-live="polite"
              aria-label={"Display: " + shown}
            >
              {shown}
            </div>
          </div>

          {/* Key grid */}
          <div className="grid grid-cols-4 gap-3">
            {KEYS.map((k) => {
              const base = KEY_STYLES[k.kind];
              const isFlashing = flash && flash.key === k.id;
              return (
                <button
                  key={k.id}
                  type="button"
                  onClick={() => press(k.id)}
                  aria-label={k.aria || k.label}
                  className="h-16 sm:h-[4.25rem] w-full font-semibold select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 transition-transform duration-75"
                  style={{
                    ...base,
                    borderRadius: brand.radius,
                    fontSize: k.kind === "op" || k.kind === "eq" ? "1.6rem" : "1.35rem",
                    transform: isFlashing ? "translateY(3px)" : "translateY(0)",
                    boxShadow: isFlashing ? "0 0 0 rgba(0,0,0,0)" : base.boxShadow,
                    border: "1px solid rgba(90,80,60,0.10)",
                  }}
                >
                  {k.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Usage notes — the little card that comes in the box */}
        <div
          className="mt-7 p-5 sm:p-6"
          style={{
            backgroundColor: "#FBF8F1",
            borderRadius: "0.9rem",
            border: "1px solid #DDD5C3",
          }}
        >
          <h2
            className="text-base font-semibold tracking-tight"
            style={{ fontFamily: brand.fontHeading, color: "#2A2620" }}
          >
            How this calculator behaves
          </h2>

          <div className="mt-4 space-y-4">
            {NOTES.map((n) => (
              <div key={n.title}>
                <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: brand.accentColor }}>
                  {n.title}
                </p>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "#4C4739" }}>
                  {n.body}
                </p>
              </div>
            ))}
          </div>

          <div className="my-5" style={{ height: 1, backgroundColor: "#E4DCCA" }} />

          <p className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: brand.accentColor }}>
            Keyboard
          </p>
          <dl className="mt-3 space-y-2">
            {SHORTCUTS.map((s) => (
              <div key={s.keys} className="flex items-baseline gap-4">
                <dt
                  className="shrink-0 text-[13px] font-semibold tabular-nums"
                  style={{
                    minWidth: "7.5rem",
                    fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                    color: "#2A2620",
                  }}
                >
                  {s.keys}
                </dt>
                <dd className="text-sm leading-relaxed" style={{ color: "#4C4739" }}>
                  {s.does}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-6 text-center text-[13px]" style={{ color: brand.neutralColor }}>
          Free to use, no sign-in, no history kept. Every sum is worked out in your browser.
        </p>
      </div>
    </div>
  );
}
