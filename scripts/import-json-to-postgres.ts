import "dotenv/config";

import fs from "node:fs/promises";
import path from "node:path";

import type { DatabaseShape } from "../lib/shared/types";
import { writeDb } from "../lib/server/db";
import { disconnectPrisma, hasPostgresDatabase } from "../lib/server/prisma";

async function main() {
  if (!process.argv.includes("--confirm")) {
    throw new Error(
      "Importacao cancelada. Execute: npm run db:import-json -- --confirm"
    );
  }

  if (!hasPostgresDatabase()) {
    throw new Error("Configure DATABASE_URL antes de importar o JSON.");
  }

  const sourcePath = path.join(process.cwd(), "data", "app-db.json");
  const contents = await fs.readFile(sourcePath, "utf8");
  const database = JSON.parse(contents) as DatabaseShape;

  await writeDb(database);

  console.log(
    `Importacao concluida: ${database.users.length} usuarios, ${database.patients.length} pacientes e ${database.messages.length} mensagens.`
  );
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectPrisma();
  });
