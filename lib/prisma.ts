import { PrismaClient } from "@prisma/client";

// Désactiver les transactions implicites
const prisma = new PrismaClient({
  transactionOptions: {
    maxWait: 0,
    timeout: 0,
  },
});

export default prisma;
