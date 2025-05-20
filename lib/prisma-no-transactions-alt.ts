import { PrismaClient } from "@prisma/client";

// Création d'une instance PrismaClient avec des options pour désactiver les transactions
const prismaNoTransactions = new PrismaClient({
  // Désactiver complètement les transactions
  transactionOptions: {
    maxWait: 0,
    timeout: 0,
  },
});

// Remplacer la méthode $transaction par une fonction qui n'utilise pas de transactions
const originalTransaction = prismaNoTransactions.$transaction;
prismaNoTransactions.$transaction = async function (arg: any) {
  console.warn(
    "Tentative d'utilisation de transaction détectée et remplacée par des opérations séquentielles"
  );

  // Si c'est une fonction callback, l'exécuter avec le client
  if (typeof arg === "function") {
    return await arg(prismaNoTransactions);
  }

  // Si c'est un tableau de promesses, les exécuter séquentiellement
  if (Array.isArray(arg)) {
    const results = [];
    for (const promise of arg) {
      results.push(await promise);
    }
    return results;
  }

  // Fallback au comportement original (ne devrait pas être utilisé)
  return await originalTransaction.call(prismaNoTransactions, arg);
} as any;

export default prismaNoTransactions;
