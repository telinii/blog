import "dotenv/config";
import { PrismaClient } from "./src/generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
async function main() {
  console.log("URL:", process.env.DATABASE_URL);
  const adapter = new PrismaMariaDb(process.env.DATABASE_URL!);
  const prisma = new PrismaClient({ adapter });
  const n = await prisma.user.count();
  console.log("USERS:", n);
}
main().catch((e) => { console.error("ERRO:", e.message); process.exit(1); });
