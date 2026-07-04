import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { prepareRelease1Baseline } from "../src/release-1-baseline";

dotenv.config({ path: resolve(fileURLToPath(new URL("../../../.env", import.meta.url))) });

if (process.env.CONFIRM_RELEASE_DATA_RESET !== "RESET_TLOZ_FOR_1_0") {
  throw new Error("Refusing to reset TLOZ data. Set CONFIRM_RELEASE_DATA_RESET=RESET_TLOZ_FOR_1_0 to continue.");
}

const prisma = new PrismaClient();
try {
  const result = await prepareRelease1Baseline(prisma);
  console.log(`Release baseline prepared: ${result.projectCount} projects, ${result.preservedUserCount} users preserved.`);
} finally {
  await prisma.$disconnect();
}
