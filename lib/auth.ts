import { PrismaAdapter } from "@next-auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
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
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          console.log(
            "Authorize function called with email:",
            credentials?.email
          );

          if (!credentials?.email || !credentials?.password) {
            console.log("Missing credentials");
            throw new Error("Email et mot de passe requis");
          }

          const user = await prisma.user.findUnique({
            where: {
              email: credentials.email,
            },
          });

          console.log("User found:", user ? "Yes" : "No");

          if (!user || !user.password) {
            console.log("User not found or no password");
            throw new Error("Utilisateur non trouvé");
          }

          console.log("User role:", user.role);

          const isPasswordValid = await compare(
            credentials.password,
            user.password
          );
          console.log("Password valid:", isPasswordValid ? "Yes" : "No");

          if (!isPasswordValid) {
            console.log("Invalid password");
            throw new Error("Mot de passe incorrect");
          }

          console.log("Authentication successful");

          // Retourner uniquement les champs nécessaires
          return {
            id: user.id,
            email: user.email,
            name: `${user.firstName} ${user.lastName}`,
            role: user.role,
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
        console.log("JWT callback - user:", user.email, "role:", user.role);
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      console.log("Session callback - token:", token.email);
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
};
