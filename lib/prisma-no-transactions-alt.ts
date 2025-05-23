import { PrismaClient } from "@prisma/client";

// Création d'une instance PrismaClient standard
const prismaNoTransactions = new PrismaClient();

// Remplacer la méthode $transaction par une fonction qui n'utilise pas de transactions
const originalTransaction =
  prismaNoTransactions.$transaction.bind(prismaNoTransactions);
prismaNoTransactions.$transaction = async <T>(arg: any): Promise<T> => {
  console.warn(
    "Tentative d'utilisation de transaction détectée et remplacée par des opérations séquentielles"
  );

  // Si c'est une fonction callback, l'exécuter avec le client
  if (typeof arg === "function") {
    return (await arg(prismaNoTransactions)) as T;
  }

  // Si c'est un tableau de promesses, les exécuter séquentiellement
  if (Array.isArray(arg)) {
    const results = [];
    for (const promise of arg) {
      results.push(await promise);
    }
    return results as unknown as T;
  }

  // Fallback au comportement original (ne devrait pas être utilisé)
  return (await originalTransaction(arg)) as T;
};

export default prismaNoTransactions;
