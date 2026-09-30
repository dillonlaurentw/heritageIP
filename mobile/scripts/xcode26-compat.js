/**
 * Xcode 26 compatibility for Expo SDK 57 (runs after `npm install`).
 *
 * expo-modules-jsi 57.0.5+ marks RuntimeScheduler's constructors with
 * SWIFT_RETURNS_RETAINED so the build is clean on Xcode 27. Xcode 26's Swift
 * compiler rejects that mark on constructors ("'RuntimeScheduler' cannot be
 * annotated with either SWIFT_RETURNS_RETAINED or SWIFT_RETURNS_UNRETAINED"),
 * so the iOS build fails. Xcode 26's compiler also reports "sending '…' risks
 * causing data races" as errors in JavaScriptRuntime.swift under Swift 6 mode.
 * On a Mac whose Xcode is older than 27: remove the mark from those two
 * constructors, and build the ExpoModulesJSI pod in Swift 5 mode (those checks
 * become warnings) with the other Swift 6 features it relies on switched on
 * (bare /regex/ literals, isolated default values, ...). Does nothing anywhere else, and is safe to run twice.
 * After upgrading to Xcode 27, delete node_modules and reinstall.
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

patch(path.join(jsi, "Sources", "ExpoModulesJSI-Cxx", "include", "RuntimeScheduler.h"), /SWIFT_RETURNS_RETAINED (RuntimeScheduler\()/g, "$1");
patch(path.join(jsi, "ExpoModulesJSI.podspec"), /s\.swift_version(\s*)= '6\.0'/, "s.swift_version$1= '5.0'");
const FEATURES = [
  "BareSlashRegexLiterals",
  "IsolatedDefaultValues",
  "DisableOutwardActorInference",
  "GlobalActorIsolatedTypesUsability",
  "InferSendableFromCaptures",
  "ConciseMagicFile",
  "ForwardTrailingClosures",
  "ImplicitOpenExistentials",
  "ImportObjcForwardDeclarations",
  "DeprecateApplicationMain",
];
const flags = FEATURES.map((f) => `-enable-upcoming-feature ${f}`).join(" ");
patch(path.join(jsi, "ExpoModulesJSI.podspec"), /(s\.pod_target_xcconfig = \{\n    'USE_HEADERMAP' => 'YES',\n)(?!    'OTHER_SWIFT_FLAGS')/, `$1    'OTHER_SWIFT_FLAGS' => '$(inherited) ${flags}',\n`);
patch(path.join(jsi, "Package.swift"), /swiftLanguageModes: \[\.v6\]/, "swiftLanguageModes: [.v5]");

if (changed) console.log(`SELF: adjusted expo-modules-jsi for Xcode ${major} (see scripts/xcode26-compat.js).`);
