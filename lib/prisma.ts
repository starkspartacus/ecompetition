import { PrismaClient } from "@prisma/client";

// Déclaration pour étendre le type global
declare global {
  var prisma: PrismaClient | undefined;
}

// Création d'une instance PrismaClient standard
let prisma: PrismaClient | undefined;

if (process.env.NODE_ENV === "production") {
  prisma = new PrismaClient();
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log:
        process.env.NODE_ENV === "development"
          ? ["query", "error", "warn"]
          : ["error"],
    });
  }
  prisma = global.prisma as PrismaClient;
}

export default prisma;
