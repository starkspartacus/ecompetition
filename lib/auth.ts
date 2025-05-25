import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import {
  getUserByEmail,
  getUserByPhoneNumber,
  type User,
} from "@/lib/auth-service";
import { CustomPrismaAdapter } from "@/lib/custom-prisma-adapter";

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(),
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
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
      profile(profile) {
        return {
          id: profile.sub,
          name: profile.name,
          email: profile.email,
          image: profile.picture,
          role: "PARTICIPANT",
        };
      },
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

          let user: User | null = null;

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

          console.log("Authentification réussie pour:", user.id);

          // S'assurer que l'ID est bien transmis
          const userId = user.id || user._id?.toString();
          if (!userId) {
            console.error(
              "ID utilisateur manquant dans les données de l'utilisateur"
            );
            throw new Error("ID utilisateur manquant");
          }

          // Vérifier que les propriétés nécessaires existent
          const firstName = user.firstName || "";
          const lastName = user.lastName || "";
          const email = user.email || "";
          const role = user.role || "PARTICIPANT";

          return {
            id: userId,
            email: email,
            name: `${firstName} ${lastName}`.trim() || "Utilisateur",
            role: role,
          };
        } catch (error) {
          console.error("Auth error:", error);
          throw error;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      console.log("🔐 JWT Callback appelé:", {
        hasUser: !!user,
        hasAccount: !!account,
        tokenId: token.id,
        tokenEmail: token.email,
      });

      // Lors de la première connexion, stocker les données utilisateur dans le token
      if (user) {
        token.id = user.id;
        token.role = user.role || "PARTICIPANT";
        token.email = user.email;
        token.name = user.name;

        console.log("🔐 JWT Callback - User connecté:", {
          id: user.id,
          role: user.role,
          email: user.email,
          name: user.name,
        });
      }

      // S'assurer que l'ID est toujours présent
      if (!token.id && token.email) {
        console.log(
          "🔐 JWT Callback - Récupération de l'ID depuis l'email:",
          token.email
        );
        try {
          const user = await getUserByEmail(token.email as string);
          if (user) {
            const userId = user.id || user._id?.toString();
            if (userId) {
              token.id = userId;
              token.role = user.role || "PARTICIPANT";
              console.log("🔐 JWT Callback - ID récupéré:", token.id);
            }
          }
        } catch (error) {
          console.error(
            "🔐 JWT Callback - Erreur lors de la récupération de l'utilisateur:",
            error
          );
        }
      }

      console.log("🔐 JWT Callback - Token final:", {
        id: token.id,
        role: token.role,
        email: token.email,
        name: token.name,
      });

      return token;
    },
    async session({ session, token }) {
      console.log("🔐 Session Callback appelé:", {
        hasToken: !!token,
        tokenId: token.id,
        sessionUserExists: !!session.user,
      });

      // S'assurer que les données du token sont transmises à la session
      if (token && session.user) {
        // Vérifier que token.id existe avant de l'assigner
        const userId = (token.id as string) || (token.sub as string) || "";
        if (userId) {
          session.user.id = userId;
        }

        session.user.role = (token.role as string) || "PARTICIPANT";
        session.user.email = (token.email as string) || "";
        session.user.name = (token.name as string) || "";

        console.log("🔐 Session Callback - Session mise à jour:", {
          id: session.user.id,
          role: session.user.role,
          email: session.user.email,
          name: session.user.name,
        });
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
