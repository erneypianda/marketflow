import { access } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const required = [
  "apps/api/package.json",
  "apps/web/package.json",
  "packages/db/package.json",
  "packages/contracts/package.json",
  "packages/config/package.json",
  "pnpm-workspace.yaml",
];

for (const relative of required) {
  await access(join(root, relative));
  console.log("ok  " + relative);
}

console.log("Estructura del monorepo lista");
