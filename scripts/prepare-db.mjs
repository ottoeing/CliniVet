import { mkdir, open } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl?.startsWith("file:")) {
  throw new Error("DATABASE_URL deve apontar para um arquivo SQLite.");
}

const databasePath = resolve(dirname(fileURLToPath(import.meta.url)), "..", "prisma", databaseUrl.slice(5));
await mkdir(dirname(databasePath), { recursive: true });
const database = await open(databasePath, "a");
await database.close();

console.log("Arquivo SQLite preparado.");
