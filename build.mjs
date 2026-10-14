// Inlines src/*.js into src/shell.html and writes one paste-ready file:
// index.html (served by GitHub Pages, and the file to paste into the Rayven
// Interface Builder Code tab).
// Usage: node build.mjs
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const src = join(here, "src");
const out = join(here, "index.html");

const html = readFileSync(join(src, "shell.html"), "utf8").replace(
  /<!-- @inline (\S+) -->/g,
  (_, file) => `<script>\n${readFileSync(join(src, file), "utf8").trim()}\n</script>`
);

writeFileSync(out, html);
// Keep the original local copy in sync if this folder sits in the Rayven workspace
const legacy = join(here, "..", "analytics-explorer.html");
if (existsSync(legacy)) writeFileSync(legacy, html);
console.log(`Built ${out} (${(html.length / 1024).toFixed(0)} KB)`);
