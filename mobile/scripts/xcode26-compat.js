/**
 * Xcode 26 compatibility for Expo SDK 57 (runs after `npm install`).
 *
 * expo-modules-jsi 57.0.5+ marks RuntimeScheduler's constructors with
 * SWIFT_RETURNS_RETAINED so the build is clean on Xcode 27. Xcode 26's Swift
 * compiler rejects that mark on constructors ("'RuntimeScheduler' cannot be
 * annotated with either SWIFT_RETURNS_RETAINED or SWIFT_RETURNS_UNRETAINED"),
 * so the iOS build fails. On a Mac whose Xcode is older than 27, remove the
 * mark from those two constructors. Does nothing anywhere else, and is safe to
 * run twice. After upgrading to Xcode 27, delete node_modules and reinstall.
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

const header = path.join(__dirname, "..", "node_modules", "expo-modules-jsi", "apple", "Sources", "ExpoModulesJSI-Cxx", "include", "RuntimeScheduler.h");
if (!fs.existsSync(header)) process.exit(0);

const before = fs.readFileSync(header, "utf8");
const after = before.replace(/SWIFT_RETURNS_RETAINED (RuntimeScheduler\()/g, "$1");
if (after !== before) {
  fs.writeFileSync(header, after);
  console.log(`SELF: adjusted expo-modules-jsi for Xcode ${major} (see scripts/xcode26-compat.js).`);
}
