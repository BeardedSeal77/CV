import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // The job hunt is local-only: nothing outside these folders may import it.
  {
    files: ["**/*.{ts,tsx,js,mjs}"],
    ignores: [
      "app/jobs/**",
      "app/api/**",
      "app/mcp/**",
      "mcp/**",
      "lib/jobhunt/**",
      "scripts/**",
    ],
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
                "@/mcp/*",
                "**/mcp/*",
                "@/app/jobs/*",
                "**/data/jobhunt/*",
              ],
              message:
                "The job hunt is local-only. Import it only from app/jobs, app/api, app/mcp, mcp/ or lib/jobhunt.",
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
  ]),
]);

export default eslintConfig;
