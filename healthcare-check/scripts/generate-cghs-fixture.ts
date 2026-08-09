import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { cghsSlice } from "../tests/fixtures/cghs-fixtures.ts";

const outputPath = resolve(process.cwd(), "tests/fixtures/cghs-slice.json");
await writeFile(outputPath, `${JSON.stringify({ rows: cghsSlice }, null, 2)}\n`, "utf8");
console.log(`Wrote ${cghsSlice.length} CGHS rows to ${outputPath}`);
