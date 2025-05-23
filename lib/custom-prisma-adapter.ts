import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { Adapter, AdapterUser } from "next-auth/adapters";
import prisma from "@/lib/prisma";

// Créer un adaptateur personnalisé qui étend l'adaptateur Prisma
export function CustomPrismaAdapter(): Adapter {
  // Obtenir l'adaptateur Prisma standard
  const standardAdapter = PrismaAdapter(prisma);

  // Étendre l'adaptateur avec des méthodes personnalisées
  return {
    ...standardAdapter,
    // Surcharger la méthode getUser pour ajouter le rôle
    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });

      if (!user) return null;

      // Ajouter le rôle à l'utilisateur
      return {
        ...user,
        role: user.role || "USER", // Valeur par défaut si le rôle n'est pas défini
      } as AdapterUser;
    },

    // Surcharger la méthode getUserByEmail pour ajouter le rôle
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) return null;

      // Ajouter le rôle à l'utilisateur
      return {
        ...user,
        role: user.role || "USER", // Valeur par défaut si le rôle n'est pas défini
      } as AdapterUser;
    },

    // Surcharger la méthode getUserByAccount pour ajouter le rôle
    async getUserByAccount({ provider, providerAccountId }) {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId,
          },
        },
        include: { user: true },
      });

      if (!account) return null;

      // Ajouter le rôle à l'utilisateur
      return {
        ...account.user,
        role: account.user.role || "USER", // Valeur par défaut si le rôle n'est pas défini
      } as AdapterUser;
    },

    // Surcharger la méthode createUser pour s'assurer que le rôle est défini
    async createUser(user: any) {
      const newUser = await prisma.user.create({
        data: {
          ...user,
          role: user.role || "USER", // Valeur par défaut si le rôle n'est pas défini
        },
      });

      return newUser as AdapterUser;
    },

    // Surcharger la méthode updateUser pour préserver le rôle
    async updateUser(user) {
      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          ...user,
          role: user.role || "USER", // Préserver le rôle ou utiliser la valeur par défaut
        },
      });

      return updatedUser as AdapterUser;
    },
  };
}
