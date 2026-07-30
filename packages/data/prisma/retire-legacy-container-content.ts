import { getPrismaClient } from "../src/drivers/prisma";
import { assertContainerContentReconciled, readCutoverState } from "../src/cutover";

const args = new Set(process.argv.slice(2));
const required = ["--confirm", "--legacy-traffic-zero", "--backup-verified"];
const missing = required.filter((flag) => !args.has(flag));
if (missing.length) {
  console.error(JSON.stringify({ error: "retirement_requires_evidence", missing }));
  process.exit(2);
}

const prisma = getPrismaClient();
try {
  const state = await readCutoverState(prisma);
  if (state.source !== "canonical" || !state.writesEnabled) throw new Error("canonical cutover must be enabled before legacy retirement");
  const reconciliation = await assertContainerContentReconciled(prisma);
  console.log(JSON.stringify({ ready: true, state, reconciliation, note: "Run the guarded retirement migration with tloz.allow_legacy_retirement=on during a maintenance window." }, null, 2));
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
