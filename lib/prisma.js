/**
 * Fichier de configuration Prisma sans TypeScript pour éviter les problèmes de compilation
 */

// Utiliser require au lieu de import pour éviter les problèmes d'initialisation
let PrismaClient;
try {
  PrismaClient = require("@prisma/client").PrismaClient;
} catch (e) {
  console.error("Erreur lors du chargement de @prisma/client:", e);
  console.log(
    'Veuillez exécuter "npx prisma generate" et redémarrer le serveur.'
  );

  // Créer un client factice pour éviter les erreurs fatales
  PrismaClient = () =>
    new Proxy(
      {},
      {
        get() {
          throw new Error(
            'Prisma Client n\'est pas initialisé. Exécutez "npx prisma generate".'
          );
        },
      }
    );
}

// Singleton pour éviter plusieurs instances en développement
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Remplacer la méthode $transaction pour éviter les erreurs avec MongoDB
prisma.$transaction = async (arg) => {
  console.warn("⚠️ $transaction est désactivé pour MongoDB sans replica set");

  if (typeof arg === "function") {
    return await arg(prisma);
  }

  if (Array.isArray(arg)) {
    const results = [];
    for (const promise of arg) {
      results.push(await promise);
    }
    return results;
  }

  throw new Error("Format de $transaction non pris en charge");
};

module.exports = prisma;
