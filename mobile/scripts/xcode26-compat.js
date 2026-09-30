/**
 * Xcode 26 compatibility for Expo SDK 57 (runs after `npm install`).
 *
 * expo-modules-jsi is written for Xcode 27's Swift compiler. Xcode 26's
 * compiler trips over it in two places:
 *
 * 1. RuntimeScheduler's constructors are marked SWIFT_RETURNS_RETAINED, which
 *    Xcode 26 rejects on constructors. Remove the mark.
 * 2. JavaScriptRuntime.swift hands raw JSI pointers into a synchronous
 *    `assumeIsolated` closure through `nonisolated(unsafe) let` copies. Xcode 26
 *    still reports "sending '…' risks causing data races" for those. Carry
 *    them in a small `@unchecked Sendable` box instead (same meaning: the
 *    pointers never leave the synchronous call).
 *
 * The module stays in Swift 6 mode, so it matches ExpoModulesCore exactly.
 * (Building it in Swift 5 mode compiled, but changed function signatures and
 * crashed at launch with "Symbol not found".)
 *
 * Only on a Mac whose Xcode is older than 27; does nothing anywhere else and is
 * safe to run twice. After upgrading to Xcode 27, delete node_modules and reinstall.
 */
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

function xcodeMajor() {
  if (process.env.XCODE_MAJOR) return Number(process.env.XCODE_MAJOR); // for testing
  if (process.platform !== "darwin") return null;
  try {
    const out = execSync("xcodebuild -version", { stdio: ["ignore", "pipe", "ignore"] }).toString();
    const m = out.match(/Xcode (\d+)/);
    return m ? Number(m[1]) : null;
  } catch {
    return null;
  }
}

const major = xcodeMajor();
if (major === null || major >= 27) process.exit(0);

const jsi = path.join(__dirname, "..", "node_modules", "expo-modules-jsi", "apple");
let changed = false;

function patch(file, from, to) {
  if (!fs.existsSync(file)) return;
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(from, to);
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed = true;
  }
}

// 1. RuntimeScheduler constructors.
patch(path.join(jsi, "Sources", "ExpoModulesJSI-Cxx", "include", "RuntimeScheduler.h"), /SWIFT_RETURNS_RETAINED (RuntimeScheduler\()/g, "$1");

// 2. Box the call-scoped pointers.
const BOX = "SELFXcode26Box";
patch(path.join(jsi, "Sources", "ExpoModulesJSI", "Runtime", "JavaScriptRuntime.swift"), /[\s\S]*/, (src) => {
  if (src.includes(BOX)) return src;
  return (
    src
      .replace(/nonisolated\(unsafe\) let (resultPtr|thisPtr|argumentsPtr) = \1\n/g, `let $1 = ${BOX}($1)\n`)
      .replace(/writeJSIValue\(to: resultPtr\)/g, "writeJSIValue(to: resultPtr.value)")
      .replace(/UnsafeMutablePointer\(mutating: thisPtr\)/g, "UnsafeMutablePointer(mutating: thisPtr.value)")
      .replace(/start: argumentsPtr, count:/g, "start: argumentsPtr.value, count:")
      .replace(/JavaScriptUnownedValue\(runtime\.pointee, thisPtr\)/g, "JavaScriptUnownedValue(runtime.pointee, thisPtr.value)") +
    `
/// Added by SELF's scripts/xcode26-compat.js: carries a call-scoped pointer into the synchronous
/// \`assumeIsolated\` closure, which Xcode 26's compiler won't accept as a \`nonisolated(unsafe)\` copy.
private struct ${BOX}<T>: @unchecked Sendable {
  let value: T
  init(_ value: T) { self.value = value }
}
`
  );
});

if (changed) console.log(`SELF: adjusted expo-modules-jsi for Xcode ${major} (see scripts/xcode26-compat.js).`);
