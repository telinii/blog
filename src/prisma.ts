import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";

let adapter: PrismaMariaDb;
if (process.env.DATABASE_URL) {
  adapter = new PrismaMariaDb(process.env.DATABASE_URL);
}
else {
    throw new Error("DATABASE_URL não está definida no .env")
}

export const prisma = new PrismaClient({ adapter })
