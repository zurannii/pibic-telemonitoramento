import "dotenv/config";

import { readDb } from "../lib/server/db";
import { disconnectPrisma } from "../lib/server/prisma";

async function main() {
  const database = await readDb();
  console.log(
    `PostgreSQL conectado: ${database.users.length} usuarios, ${database.patients.length} pacientes, ${database.messages.length} mensagens e ${database.alerts.length} alertas.`
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
