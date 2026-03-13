const fs = require("fs");
const path = require("path");

const repoRoot = path.join(__dirname, "..");
const distDir = path.join(repoRoot, "dist");
const appJsonPath = path.join(repoRoot, "app.json");

function normalizeBaseUrl(baseUrl) {
  if (typeof baseUrl !== "string" || baseUrl.trim() === "") {
    return "/";
  }
  let normalized = baseUrl.trim();
  if (!normalized.startsWith("/")) {
    normalized = `/${normalized}`;
  }
  if (!normalized.endsWith("/")) {
    normalized += "/";
  }
  return normalized;
}

function loadBaseUrl() {
  try {
    const raw = fs.readFileSync(appJsonPath, "utf8");
    const json = JSON.parse(raw);
    return normalizeBaseUrl(json?.expo?.web?.baseUrl);
  } catch {
    return "/";
  }
}

function shouldPatchFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return [".html", ".js", ".json", ".css", ".map"].includes(ext);
}

function patchFile(filePath, baseUrl) {
  if (!shouldPatchFile(filePath)) {
    return;
  }

  const original = fs.readFileSync(filePath, "utf8");
  let updated = original;

  updated = updated.replaceAll("/_expo/", `${baseUrl}_expo/`);
  updated = updated.replaceAll("/assets/", `${baseUrl}assets/`);
  updated = updated.replaceAll("/favicon.ico", `${baseUrl}favicon.ico`);

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, "utf8");
  }
}

function walk(dir, baseUrl) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, baseUrl);
    } else if (entry.isFile()) {
      patchFile(fullPath, baseUrl);
    }
  }
}

function main() {
  const baseUrl = loadBaseUrl();
  if (baseUrl === "/") {
    return;
  }
  if (!fs.existsSync(distDir)) {
    throw new Error(`dist directory not found at ${distDir}`);
  }
  walk(distDir, baseUrl);
}

main();
