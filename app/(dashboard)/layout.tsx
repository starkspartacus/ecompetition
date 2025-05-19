"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { DashboardNav } from "@/components/dashboard-nav";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Ne rien faire si le statut est toujours en chargement
    if (status === "loading") return;

    // Rediriger si pas de session
    if (status === "unauthenticated") {
      router.push("/signin");
    } else {
      setIsLoading(false);
    }
  }, [status, router]); // Dépendances minimales

  if (isLoading && status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col">
      {session?.user && <DashboardNav user={session.user} />}
      <div className="flex-1 p-8">{children}</div>
    </div>
  );
}
