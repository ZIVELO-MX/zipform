import { PrismaClient } from "@prisma/client";
import {
  LegacyRetirementError,
  parseRetirementArgs,
  retireLegacy,
} from "../src/legacy-retirement";

function createRetirementClient() {
  const directUrl = process.env.DIRECT_URL;
  if (!directUrl) {
    throw new LegacyRetirementError(
      "retirement_database_url_missing",
      "DIRECT_URL es obligatorio para ejecutar el retiro con una conexión directa.",
    );
  }
  return new PrismaClient({ datasources: { db: { url: directUrl } } });
}

let options;
try {
  options = parseRetirementArgs(process.argv.slice(2));
} catch (error) {
  if (error instanceof LegacyRetirementError) {
    console.error(JSON.stringify({ error: error.code, message: error.message, details: error.details }));
  } else {
    console.error(JSON.stringify({ error: "retirement_requires_evidence", message: "No se pudieron validar las compuertas de retiro." }));
  }
  process.exit(2);
}

let prisma: PrismaClient | undefined;
try {
  prisma = createRetirementClient();
  const result = await retireLegacy(prisma, options.execute);
  console.log(JSON.stringify(result, null, 2));
} catch (error) {
  if (error instanceof LegacyRetirementError) {
    console.error(JSON.stringify({ error: error.code, message: error.message, details: error.details }));
  } else {
    console.error(JSON.stringify({ error: "retirement_failed", message: "El retiro no se completó y la transacción fue revertida." }));
  }
  process.exitCode = 1;
} finally {
  await prisma?.$disconnect();
}
