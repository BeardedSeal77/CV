import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The job hunt is local-only: nothing outside these folders may import it.
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    ignores: ["app/jobs/**", "lib/jobhunt/**", "lib/backend.ts", "scripts/**"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              group: [
                "@/lib/jobhunt",
                "@/lib/jobhunt/*",
                "**/lib/jobhunt",
                "**/lib/jobhunt/*",
                "@/app/jobs/*",
                "**/data/jobhunt/*",
              ],
              message:
                "The job hunt is local-only. Import it only from app/jobs or lib/jobhunt.",
            },
          ],
        },
      ],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // the Python backend (and its virtualenv)
    "backend/**",
  ]),
]);

export default eslintConfig;
