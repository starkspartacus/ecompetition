import type React from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import { SessionProvider } from "@/components/session-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "e-compétition",
  description: "Plateforme de gestion de compétitions sportives",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Nous n'utilisons plus getServerSession ici pour éviter l'erreur JWT
  // La session sera gérée par le middleware et les composants clients

  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
