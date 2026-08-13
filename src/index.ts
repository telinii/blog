import "dotenv/config";
import { PrismaClient } from "./generated/prisma/client";
import { PrismaMariaDb } from "@prisma/adapter-mariadb";
let adapter: PrismaMariaDb; // declarei aqui, vazio por enquanto

if (process.env.DATABASE_URL) {
  adapter = new PrismaMariaDb(process.env.DATABASE_URL);
}
else {
    throw new Error("DATABASE_URL não está definida no .env")
}
const  prisma = new PrismaClient({adapter});
console.log("Conectado!")