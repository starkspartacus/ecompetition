"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { RealTimeNotifications } from "@/components/real-time-notifications";
import { useWebSocket } from "@/hooks/use-websocket";
import { DashboardNav } from "@/components/dashboard-nav";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const { isConnected, connectionError } = useWebSocket({ debug: false });

  useEffect(() => {
    // Ne rien faire si le statut est toujours en chargement
    if (status === "loading") return;

    // Rediriger si pas de session
    if (status === "unauthenticated") {
      router.push("/signin");
      return;
    }

    // Marquer comme chargé si on a une session
    if (status === "authenticated") {
      setIsLoading(false);
    }
  }, [status, router]);

  // Écran de chargement
  if (status === "loading" || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-lg font-medium text-gray-600 dark:text-gray-300">
            Chargement de votre espace...
          </p>
        </div>
      </div>
    );
  }

  // Redirection si pas de session (ne devrait pas arriver grâce au useEffect)
  if (!session?.user) {
    return null;
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      {/* Header avec DashboardNav */}
      <DashboardNav
        user={{
          ...session.user,
          // Assurer que role existe pour TypeScript
          role: session.user.role || "PARTICIPANT",
        }}
      />

      {/* WebSocket connection error alert - only in development */}
      {process.env.NODE_ENV === "development" && connectionError && (
        <Alert variant="destructive" className="mx-auto my-2 max-w-7xl">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Problème de connexion WebSocket</AlertTitle>
          <AlertDescription>
            Les notifications en temps réel ne sont pas disponibles. Erreur:{" "}
            {connectionError}
            <br />
            <span className="font-mono text-xs">
              Conseil: Exécutez <code>node server.ts</code> pour démarrer le
              serveur WebSocket.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Main content */}
      <main className="flex-1 p-4 transition-all duration-300 ease-in-out md:p-6 lg:p-8 pb-16 md:pb-8">
        <div className="mx-auto max-w-7xl">{children}</div>
      </main>

      {/* Notifications en temps réel */}
      <RealTimeNotifications />
    </div>
  );
}
