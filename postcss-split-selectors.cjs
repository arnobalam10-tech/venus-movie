// Old Safari (iOS < 15) discards an entire rule if ANY selector in its comma
// list is unknown to it. Tailwind's reset puts ::backdrop and
// ::file-selector-button in the same list as `*`, so on those devices the whole
// reset is lost. Splitting such lists into one rule per selector keeps the
// valid selectors working and is a no-op for modern browsers.
const FRAGILE = /::backdrop|::file-selector-button|:where\(|:is\(|:-moz-|::-moz-/;

function splitTopLevel(selector) {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = "";
  for (let i = 0; i < selector.length; i++) {
    const ch = selector[i];
    if (quote) {
      current += ch;
      if (ch === "\\") current += selector[++i] ?? "";
      else if (ch === quote) quote = null;
      continue;
    }
    if (ch === "\\") {
      current += ch + (selector[++i] ?? "");
    } else if (ch === '"' || ch === "'") {
      quote = ch;
      current += ch;
    } else if (ch === "(" || ch === "[") {
      depth++;
      current += ch;
    } else if (ch === ")" || ch === "]") {
      depth--;
      current += ch;
    } else if (ch === "," && depth === 0) {
      parts.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current.trim());
  return parts;
}

const plugin = () => ({
  postcssPlugin: "split-fragile-selector-lists",
  OnceExit(root) {
    root.walkRules((rule) => {
      const parent = rule.parent;
      if (parent && parent.type === "atrule" && /keyframes$/i.test(parent.name)) return;
      if (!FRAGILE.test(rule.selector)) return;
      const parts = splitTopLevel(rule.selector);
      if (parts.length < 2) return;
      for (const selector of parts) rule.before(rule.clone({ selector }));
      rule.remove();
    });
  },
});
plugin.postcss = true;

module.exports = plugin;
