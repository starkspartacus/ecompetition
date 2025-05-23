import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { compare } from "bcrypt";
import { getUserByEmail, getUserByPhoneNumber } from "@/lib/auth-service";
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

          console.log("Authentification réussie pour:", user.id);

          // Vérifier que les propriétés nécessaires existent
          const firstName = user.firstName || "";
          const lastName = user.lastName || "";
          const email = user.email || "";
          const role = user.role || "PARTICIPANT";

          return {
            id: user.id,
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
      // Conserver les données existantes lors des rafraîchissements de token
      if (user) {
        token.id = user.id;
        token.role = user.role || "PARTICIPANT";

        // Ajouter des logs pour déboguer
        console.log("JWT Callback - User:", { id: user.id, role: user.role });
        console.log("JWT Callback - Token après mise à jour:", token);
      }
      return token;
    },
    async session({ session, token }) {
      // S'assurer que les données du token sont transmises à la session
      if (token && session.user) {
        session.user.id = token.id;
        session.user.role = token.role || "PARTICIPANT";

        // Ajouter des logs pour déboguer
        console.log("Session Callback - Token:", {
          id: token.id,
          role: token.role,
        });
        console.log(
          "Session Callback - Session après mise à jour:",
          session.user
        );
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
