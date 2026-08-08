import { getPrismaClient } from "../src/drivers/prisma";
import {
  backfillContainerContent,
  reconcileContainerContent,
} from "../src/container-content-backfill";

const args = new Set(process.argv.slice(2));
const unknown = [...args].filter((arg) => !["--apply", "--reconcile"].includes(arg));

if (unknown.length) {
  console.error(JSON.stringify({ error: "unknown_arguments", arguments: unknown }));
  process.exitCode = 2;
} else {
  const prisma = getPrismaClient();
  try {
    if (args.has("--reconcile")) {
      const result = await reconcileContainerContent(prisma);
      console.log(JSON.stringify(result, null, 2));
      if (!result.matches) process.exitCode = 1;
    } else {
      const result = await backfillContainerContent(prisma, args.has("--apply"));
      console.log(JSON.stringify(result, null, 2));
    }
  } catch (error) {
    console.error(JSON.stringify({
      error: error instanceof Error ? error.name : "UnknownError",
      message: error instanceof Error ? error.message : String(error),
    }));
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}
