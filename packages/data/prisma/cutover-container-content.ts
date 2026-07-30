import { getPrismaClient } from "../src/drivers/prisma";
import { assertContainerContentReconciled, readCutoverState, setCutoverState } from "../src/cutover";

const args = new Set(process.argv.slice(2));
const command = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
const allowed = new Set(["status", "prepare", "enable", "rollback"]);
const confirm = args.has("--confirm");

if (!command || !allowed.has(command)) {
  console.error("Usage: cutover-container-content.ts <status|prepare|enable|rollback> [--confirm]");
  process.exit(2);
}

const prisma = getPrismaClient();
try {
  if (command === "status") {
    console.log(JSON.stringify({ state: await readCutoverState(prisma), reconciliation: await assertContainerContentReconciled(prisma) }, null, 2));
  } else {
    if (!confirm) throw new Error("Mutating a cutover requires --confirm");
    const reconciliation = await assertContainerContentReconciled(prisma);
    const current = await readCutoverState(prisma);
    const source = command === "enable" ? "canonical" : "legacy";
    const writesEnabled = command !== "prepare";
    const state = await setCutoverState(prisma, { source, writesEnabled, reason: `TLO-0080 ${command}` }, current.version);
    console.log(JSON.stringify({ state, reconciliation }, null, 2));
  }
} catch (error) {
  console.error(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
