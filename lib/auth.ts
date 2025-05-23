import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { getUserByEmail, getUserByPhoneNumber } from "@/lib/auth-service";
import prisma from "@/lib/prisma";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 jours
  },
  pages: {
    signIn: "/signin",
    signOut: "/",
    error: "/signin",
    verifyRequest: "/verify",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        phoneNumber: { label: "Phone Number", type: "text" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.email && !credentials?.phoneNumber) {
            throw new Error("Email ou numéro de téléphone requis");
          }

          if (!credentials?.password) {
            throw new Error("Mot de passe requis");
          }

          console.log("Tentative de connexion avec:", {
            email: credentials.email,
            phoneNumber: credentials.phoneNumber,
          });

          // Recherche par email ou par numéro de téléphone
          let user = null;

          if (credentials.email) {
            user = await getUserByEmail(credentials.email);
            console.log(
              "Utilisateur trouvé par email:",
              user ? user.id : "non trouvé"
            );
          } else if (credentials.phoneNumber) {
            user = await getUserByPhoneNumber(credentials.phoneNumber);
            console.log(
              "Utilisateur trouvé par téléphone:",
              user ? user.id : "non trouvé"
            );
          }

          if (!user || !user.password) {
            console.error("Utilisateur non trouvé ou sans mot de passe");
            throw new Error("Utilisateur non trouvé");
          }

          console.log(
            "Vérification du mot de passe pour l'utilisateur:",
            user.id
          );
          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );

          if (!isPasswordValid) {
            console.error("Mot de passe incorrect");
            throw new Error("Mot de passe incorrect");
          }

          // Normaliser les champs country/countryCode
          const countryCode = user.countryCode || user.country || "FR";

          console.log("Authentification réussie pour:", user.id);

          // Retourner uniquement les champs nécessaires
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
            countryCode: countryCode,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.countryCode = user.countryCode;
      }
      return token;
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.countryCode = token.countryCode as string;
      }
      return session;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      else if (new URL(url).origin === baseUrl) return url;
      return baseUrl;
    },
  },
  debug: process.env.NODE_ENV === "development",
  secret: process.env.NEXTAUTH_SECRET,
};
