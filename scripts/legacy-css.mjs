// Runs after `next build`. Next's CSS minifier rewrites rgba() back into
// #rrggbbaa / #rgba, which Safari 9 (iOS 9) doesn't understand: it drops the
// whole declaration, so e.g. border-white/10 turns into a solid white border.
// Rewriting the final files is the only point after the minifier has run.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");

const HEX_ALPHA = /#([0-9a-f]{8}|[0-9a-f]{4})(?![0-9a-f])/gi;

function toRgba(hex) {
  const full = hex.length === 4 ? hex.replace(/./g, (c) => c + c) : hex;
  const [r, g, b, a] = [0, 2, 4, 6].map((i) => parseInt(full.slice(i, i + 2), 16));
  return "rgba(" + r + "," + g + "," + b + "," + Math.round((a / 255) * 1000) / 1000 + ")";
}

function* cssFiles(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* cssFiles(full);
    else if (entry.name.endsWith(".css")) yield full;
  }
}

let changed = 0;
for (const file of cssFiles(path.join(root, ".next", "static"))) {
  const before = fs.readFileSync(file, "utf8");
  const after = before.replace(HEX_ALPHA, (_, hex) => toRgba(hex));
  if (after !== before) {
    fs.writeFileSync(file, after);
    changed++;
  }
}
console.log("legacy-css: rewrote " + changed + " stylesheet(s)");
