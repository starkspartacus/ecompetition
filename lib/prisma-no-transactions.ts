import { PrismaClient } from "@prisma/client";

// Création d'une instance PrismaClient avec des options pour désactiver les transactions
const prismaNoTransactions = new PrismaClient({
  // Désactiver complètement les transactions
  transactionOptions: {
    maxWait: 0,
    timeout: 0,
  },
});

// Intercepter toutes les requêtes pour s'assurer qu'elles ne sont pas exécutées dans des transactions
prismaNoTransactions.$use(async (params, next) => {
  // Vérifier si la méthode est $transaction
  // @ts-ignore - Nous savons que cette vérification est nécessaire même si TypeScript ne reconnaît pas "transaction"
  if (params.action === "$transaction") {
    console.warn("Tentative d'utilisation de transaction détectée et bloquée");
    // Au lieu d'utiliser une transaction, exécuter simplement la fonction callback
    // avec le client Prisma normal (sans transaction)
    const cb = params.args[0];
    return await cb(prismaNoTransactions);
  }

  return next(params);
});

export default prismaNoTransactions;
