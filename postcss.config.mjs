import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {},
    // Tailwind 4 wraps everything in @layer, which Safari < 15.4 ignores
    // entirely (unstyled page). This flattens layers into plain CSS.
    "@csstools/postcss-cascade-layers": {},
    // Splits selector lists that old Safari would reject as a whole. Next
    // requires plugins as strings, so the local file needs an absolute path.
    [fileURLToPath(new URL("./postcss-split-selectors.cjs", import.meta.url))]: {},
  },
};

export default config;
